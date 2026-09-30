"""MongoDB database connection and models with in-memory fallback"""
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)
from pymongo import ASCENDING, DESCENDING
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.config import settings
import logging
import uuid

logger = logging.getLogger(__name__)

# Global database instance
db: Optional[AsyncIOMotorDatabase] = None
client: Optional[AsyncIOMotorClient] = None

# In-Memory Database Fallback Store
class InMemoryDB:
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.summaries: Dict[str, Dict[str, Any]] = {}
        self.costs: Dict[str, Dict[str, Any]] = {}
        self.conversations: Dict[str, Dict[str, Any]] = {}
        self.evaluations: Dict[str, Dict[str, Any]] = {}
        self.comparisons: Dict[str, Dict[str, Any]] = {}
        self.users: Dict[str, Dict[str, Any]] = {}
        self.organizations: Dict[str, Dict[str, Any]] = {}

memory_db = InMemoryDB()


async def connect_db():
    """Connect to MongoDB with graceful fallback to in-memory store"""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        db = client[settings.MONGODB_DB]
        await client.admin.command('ping')
        logger.info("✓ MongoDB connected successfully")
        await create_indexes()
        return db
    except Exception as e:
        logger.warning(f"⚠️ MongoDB connection failed ({e}). Operating in resilient In-Memory Database Mode.")
        db = None
        return None


async def disconnect_db():
    """Disconnect from MongoDB"""
    global client, db
    if client:
        try:
            client.close()
        except Exception:
            pass
        logger.info("✓ MongoDB connection closed")


async def create_indexes():
    """Create database indexes for performance"""
    if db is None:
        return
    
    try:
        documents = db["documents"]
        await documents.create_index([("organizationId", ASCENDING), ("createdAt", DESCENDING)])
        await documents.create_index([("ownerId", ASCENDING), ("createdAt", DESCENDING)])
        await documents.create_index([("processingStatus", ASCENDING)])
        
        summaries = db["summaries"]
        await summaries.create_index([("documentId", ASCENDING), ("createdAt", DESCENDING)])
        await summaries.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        await summaries.create_index([("organizationId", ASCENDING)])
        
        costs = db["documentCosts"]
        await costs.create_index([("organizationId", ASCENDING), ("createdAt", DESCENDING)])
        
        conversations = db["conversations"]
        await conversations.create_index([("organizationId", ASCENDING), ("userId", ASCENDING), ("createdAt", DESCENDING)])
        # MongoDB 30-day (2,592,000 seconds) automatic TTL retention deletion index
        await conversations.create_index("createdAt", expireAfterSeconds=2592000)
        
        users = db["users"]
        await users.create_index([("email", ASCENDING)])
        await users.create_index([("organizationId", ASCENDING)])
        
        logger.info("✓ Database indexes and 30-day TTL conversation retention index created")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")


# ==================== Document Operations ====================

async def create_document(data: Dict[str, Any]) -> str:
    """Create a new document"""
    doc_id = str(uuid.uuid4())
    data["documentId"] = doc_id
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()
    
    if db is not None:
        try:
            result = await db["documents"].insert_one(data)
            data["_id"] = str(result.inserted_id)
        except Exception as e:
            logger.warning(f"MongoDB insert failed, using memory DB: {e}")
    
    memory_db.documents[doc_id] = data
    return doc_id


async def get_document(document_id: str) -> Optional[Dict]:
    """Get document by ID"""
    if document_id in memory_db.documents:
        return memory_db.documents[document_id]
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(document_id)}
            except Exception:
                query = {"documentId": document_id}
            
            result = await db["documents"].find_one(query)
            if result:
                result["documentId"] = str(result.get("documentId", result.get("_id")))
                memory_db.documents[result["documentId"]] = result
                return result
        except Exception as e:
            logger.error(f"MongoDB get_document error: {e}")
            
    return None


async def list_documents(organization_id: Optional[str], skip: int = 0, limit: int = 20, owner_id: Optional[str] = None, include_all: bool = False) -> tuple:
    """List documents in the caller's scope."""
    if db is not None:
        try:
            collection = db["documents"]
            query: Dict[str, Any] = {}
            if organization_id:
                query["organizationId"] = organization_id
            if owner_id and not include_all:
                query["ownerId"] = owner_id
            docs = await collection.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(None)
            total = await collection.count_documents(query)
            
            for doc in docs:
                doc["documentId"] = str(doc.get("documentId", doc.get("_id")))
                memory_db.documents[doc["documentId"]] = doc
            return docs, total
        except Exception as e:
            logger.warning(f"MongoDB list_documents failed, using memory DB: {e}")
            
    # Fallback to memory DB
    matched = [
        doc for doc in memory_db.documents.values()
        if (include_all or doc.get("organizationId") == organization_id or organization_id in ("all", None))
        and (include_all or owner_id is None or doc.get("ownerId") == owner_id)
    ]
    matched.sort(key=lambda x: x.get("createdAt", datetime.min), reverse=True)
    total = len(matched)
    paginated = matched[skip:skip + limit]
    return paginated, total


async def update_document(document_id: str, data: Dict[str, Any]) -> bool:
    """Update document"""
    data["updatedAt"] = datetime.utcnow()
    
    if document_id in memory_db.documents:
        memory_db.documents[document_id].update(data)
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(document_id)}
            except Exception:
                query = {"documentId": document_id}
                
            result = await db["documents"].update_one(query, {"$set": data})
            return result.modified_count > 0 or document_id in memory_db.documents
        except Exception as e:
            logger.warning(f"MongoDB update_document error: {e}")
            
    return document_id in memory_db.documents


async def delete_document(document_id: str) -> bool:
    """Delete document"""
    if document_id in memory_db.documents:
        del memory_db.documents[document_id]
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(document_id)}
            except Exception:
                query = {"documentId": document_id}
            await db["documents"].delete_one(query)
        except Exception as e:
            logger.warning(f"MongoDB delete_document error: {e}")
            
    return True


# ==================== Summary Operations ====================

async def create_summary(data: Dict[str, Any]) -> str:
    """Create a new summary"""
    summary_id = str(uuid.uuid4())
    data["summaryId"] = summary_id
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()
    
    if db is not None:
        try:
            result = await db["summaries"].insert_one(data)
            data["_id"] = str(result.inserted_id)
        except Exception as e:
            logger.warning(f"MongoDB create_summary error: {e}")
            
    memory_db.summaries[summary_id] = data
    return summary_id


async def get_summary(summary_id: str) -> Optional[Dict]:
    """Get summary by ID"""
    if summary_id in memory_db.summaries:
        return memory_db.summaries[summary_id]
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(summary_id)}
            except Exception:
                query = {"summaryId": summary_id}
            
            result = await db["summaries"].find_one(query)
            if result:
                result["summaryId"] = str(result.get("summaryId", result.get("_id")))
                memory_db.summaries[result["summaryId"]] = result
                return result
        except Exception as e:
            logger.error(f"MongoDB get_summary error: {e}")
            
    return None


async def list_summaries(document_id: Optional[str] = None, organization_id: Optional[str] = None, owner_id: Optional[str] = None) -> List[Dict]:
    """List summaries"""
    if db is not None:
        try:
            query = {}
            if document_id:
                query["documentId"] = document_id
            if organization_id and organization_id != "all":
                query["organizationId"] = organization_id
            if owner_id:
                query["userId"] = owner_id
            
            summaries = await db["summaries"].find(query).sort("createdAt", -1).to_list(None)
            for s in summaries:
                s["summaryId"] = str(s.get("summaryId", s.get("_id")))
                memory_db.summaries[s["summaryId"]] = s
            return summaries
        except Exception as e:
            logger.warning(f"MongoDB list_summaries error: {e}")
            
    # Memory fallback
    results = []
    for s in memory_db.summaries.values():
        if document_id and s.get("documentId") != document_id:
            continue
        if organization_id and organization_id != "all" and s.get("organizationId") != organization_id:
            continue
        if owner_id and s.get("userId") != owner_id:
            continue
        results.append(s)
    results.sort(key=lambda x: x.get("createdAt", datetime.min), reverse=True)
    return results


# ==================== Cost Operations ====================

async def create_cost_record(data: Dict[str, Any]) -> str:
    """Create cost record"""
    cost_id = str(uuid.uuid4())
    data["costId"] = cost_id
    data["createdAt"] = datetime.utcnow()
    
    if db is not None:
        try:
            await db["documentCosts"].insert_one(data)
        except Exception as e:
            logger.warning(f"MongoDB create_cost_record error: {e}")
            
    memory_db.costs[cost_id] = data
    return cost_id


async def get_organization_costs(organization_id: str, days: int = 30) -> tuple:
    """Get organization costs for last N days"""
    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)
    
    if db is not None:
        try:
            costs = await db["documentCosts"].find({
                "organizationId": organization_id,
                "createdAt": {"$gte": start_date}
            }).to_list(None)
            return costs, len(costs)
        except Exception as e:
            logger.warning(f"MongoDB get_organization_costs error: {e}")
            
    costs = [
        c for c in memory_db.costs.values()
        if (c.get("organizationId") == organization_id or organization_id == "all" or not organization_id)
        and c.get("createdAt", datetime.utcnow()) >= start_date
    ]
    return costs, len(costs)


# ==================== User Operations ====================

async def create_user(data: Dict[str, Any]) -> str:
    user_id = str(uuid.uuid4())
    data["userId"] = user_id
    data["createdAt"] = datetime.utcnow()
    memory_db.users[user_id] = data
    return user_id


async def get_user_by_email(email: str) -> Optional[Dict]:
    for u in memory_db.users.values():
        if u.get("email", "").lower() == email.lower():
            return u
    return None


async def get_user(user_id: str) -> Optional[Dict]:
    return memory_db.users.get(user_id)


# ==================== Organization Operations ====================

async def create_organization(data: Dict[str, Any]) -> str:
    org_id = str(uuid.uuid4())
    data["organizationId"] = org_id
    data["createdAt"] = datetime.utcnow()
    memory_db.organizations[org_id] = data
    return org_id


async def get_organization(org_id: str) -> Optional[Dict]:
    return memory_db.organizations.get(org_id)


# ==================== Conversation Operations ====================

async def create_conversation(data: Dict[str, Any]) -> str:
    conv_id = str(uuid.uuid4())
    data["conversationId"] = conv_id
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()
    if "messages" not in data:
        data["messages"] = []
        
    if db is not None:
        try:
            await db["conversations"].insert_one(data)
        except Exception as e:
            logger.warning(f"MongoDB create_conversation error: {e}")
            
    memory_db.conversations[conv_id] = data
    return conv_id


async def add_message_to_conversation(conversation_id: str, message: Dict[str, Any]) -> bool:
    message["timestamp"] = datetime.utcnow()
    if conversation_id in memory_db.conversations:
        memory_db.conversations[conversation_id].setdefault("messages", []).append(message)
        memory_db.conversations[conversation_id]["updatedAt"] = datetime.utcnow()
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(conversation_id)}
            except Exception:
                query = {"conversationId": conversation_id}
            await db["conversations"].update_one(
                query,
                {
                    "$push": {"messages": message},
                    "$set": {"updatedAt": datetime.utcnow()}
                }
            )
        except Exception as e:
            logger.warning(f"MongoDB add_message_to_conversation error: {e}")
            
    return True


async def get_conversation(conversation_id: str) -> Optional[Dict]:
    if conversation_id in memory_db.conversations:
        return memory_db.conversations[conversation_id]
        
    if db is not None:
        try:
            from bson.objectid import ObjectId
            try:
                query = {"_id": ObjectId(conversation_id)}
            except Exception:
                query = {"conversationId": conversation_id}
            result = await db["conversations"].find_one(query)
            if result:
                result["conversationId"] = str(result.get("conversationId", result.get("_id")))
                memory_db.conversations[result["conversationId"]] = result
                return result
        except Exception as e:
            logger.error(f"MongoDB get_conversation error: {e}")
            
    return None


async def list_conversations(document_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict]:
    """List active conversations (enforcing 30-day retention cutoff)"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=30)
    
    if db is not None:
        try:
            query: Dict[str, Any] = {"createdAt": {"$gte": cutoff}}
            if document_id:
                query["documentId"] = document_id
            if user_id:
                query["userId"] = user_id
            cursor = db["conversations"].find(query).sort("updatedAt", DESCENDING)
            convs = await cursor.to_list(length=100)
            for c in convs:
                c["conversationId"] = str(c.get("conversationId", c.get("_id")))
                memory_db.conversations[c["conversationId"]] = c
            return convs
        except Exception as e:
            logger.warning(f"MongoDB list_conversations query error: {e}")

    res = []
    for c in list(memory_db.conversations.values()):
        created_at = c.get("createdAt")
        if isinstance(created_at, datetime) and created_at < cutoff:
            memory_db.conversations.pop(c.get("conversationId", ""), None)
            continue
        if (not document_id or c.get("documentId") == document_id) and (not user_id or c.get("userId") == user_id):
            res.append(c)
    res.sort(key=lambda x: x.get("updatedAt", datetime.min), reverse=True)
    return res
