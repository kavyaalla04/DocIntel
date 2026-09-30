"""Main FastAPI Application for Document Intelligence & Audio Briefing Platform"""
import os
import logging
import mimetypes
import uuid
import hashlib
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException, status, Depends
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import settings
from app import database
from app.services.extraction_service import extraction_service
from app.services.llm_service import llm_service
from app.services.retrieval_service import retrieval_service
from app.services.multi_agent_service import multi_agent_service
from app.services.audio_service import audio_service
from app.services.evaluation_service import evaluation_service
from app.services.comparison_service import comparison_service
from app.services.demo_service import demo_service
from app.services.cost_service import cost_service
from app.schemas import LoginRequest

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
auth_scheme = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme)) -> Dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        return jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")


def is_admin(user: Dict[str, Any]) -> bool:
    return user.get("role") == "Administrator"


def require_document_access(doc: Optional[Dict[str, Any]], user: Dict[str, Any]) -> Dict[str, Any]:
    if not doc or (not is_admin(user) and doc.get("ownerId") != user.get("sub")):
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


async def require_summary_access(summary: Optional[Dict[str, Any]], user: Dict[str, Any]) -> Dict[str, Any]:
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    if is_admin(user):
        return summary
    if summary.get("userId") == user.get("sub"):
        return summary
    doc = await database.get_document(summary.get("documentId", ""))
    if not doc or doc.get("ownerId") != user.get("sub"):
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary


# ==================== Lifespan Management ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup and shutdown)"""
    logger.info("🚀 Starting Document Intelligence & Audio Briefing Platform")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "audio"), exist_ok=True)
    
    try:
        await database.connect_db()
    except Exception as e:
        logger.warning(f"Database connection setup note: {e}")
    
    yield
    logger.info("🛑 Shutting down Document Intelligence Platform")
    await database.disconnect_db()
    await llm_service.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI-Powered Document Intelligence & Audio Briefing Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health & Readiness ====================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "llm_provider": (
            "ManagedGateway" if "keygateway1.arshnivlabs.com" in settings.OPENROUTER_BASE_URL.lower()
            else "OpenRouter" if settings.OPENROUTER_API_KEY
            else "LocalFallbackEngine"
        )
    }


@app.get("/ready")
async def readiness_check():
    db_status = "connected" if database.db is not None else "in_memory_resilient"
    return {
        "ready": True,
        "database": db_status,
        "message": "Document Intelligence Platform ready"
    }


# ==================== Authentication Endpoints ====================

@app.post("/api/v1/auth/login")
async def user_login(request: LoginRequest):
    """Create a signed session for a demo workspace user."""
    email = request.email.lower().strip()
    if request.password != "password123":
        raise HTTPException(status_code=401, detail="Invalid email or password")
    org_id = request.organizationId or "org_default"

    # Simple Standard Demo Profiles
    demo_profiles = {
        "admin@company.com": {
            "name": "System Admin",
            "role": "Administrator",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "org": "org_default"
        },
        "user@company.com": {
            "name": "Standard User",
            "role": "Standard User",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            "org": "org_default"
        },
        "finance@company.com": {
            "name": "Financial Officer",
            "role": "Financial Officer",
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            "org": "org_finance"
        }
    }

    profile = demo_profiles.get(email, {
        "name": email.split("@")[0].replace(".", " ").title() if "@" in email else "Enterprise User",
        "role": "Standard User",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "org": org_id
    })

    # Stable IDs keep a user's documents and history available across sessions.
    user_id = f"usr_{hashlib.sha256(email.encode('utf-8')).hexdigest()[:12]}"
    expires_at = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    signed_token = jwt.encode(
        {"sub": user_id, "email": email, "role": profile["role"], "org": request.organizationId or profile["org"], "exp": expires_at},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

    return {
        "status": "success",
        "message": "Authentication successful",
        "token": signed_token,
        "user": {
            "userId": user_id,
            "name": profile["name"],
            "email": email,
            "role": profile["role"],
            "organizationId": request.organizationId or profile["org"],
            "avatar": profile["avatar"],
            "authenticatedAt": datetime.utcnow().isoformat()
        },
        "expiresIn": 86400
    }


@app.get("/api/v1/auth/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Return the authenticated session profile."""
    return {
        "status": "valid",
        "authenticated": True,
        "userId": user.get("sub"),
        "role": user.get("role"),
        "session": "Active JWT Bearer Session",
        "timestamp": datetime.utcnow().isoformat()
    }



# ==================== Document Ingestion Endpoints ====================

@app.post("/api/v1/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    organizationId: str = Form("org_default"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload text-based documents, presentations and spreadsheets for analysis."""
    try:
        safe_name = os.path.basename(file.filename or "upload.pdf")
        # Strip control characters and path separators before persisting the
        # client supplied name; keep the extension for format validation.
        safe_name = re.sub(r"[^A-Za-z0-9._ -]", "_", safe_name).strip(" .") or "upload.pdf"
        extension = os.path.splitext(safe_name)[1].lower()
        supported_extensions = {".pdf", ".docx", ".pptx", ".xlsx", ".txt", ".md", ".csv", ".json", ".yaml", ".yml", ".parquet", ".pq"}
        if extension not in supported_extensions:
            raise HTTPException(status_code=415, detail=f"Unsupported file type '{extension or 'unknown'}'. Supported types: {', '.join(sorted(supported_extensions))}")
        file_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4().hex[:8]}_{safe_name}")
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File exceeds the {settings.MAX_FILE_SIZE_MB} MB upload limit")
        with open(file_path, 'wb') as f:
            f.write(content)
            
        guessed_type, _ = mimetypes.guess_type(safe_name)
        file_type = file.content_type or guessed_type or "application/octet-stream"
        
        # Extract & Clean
        extracted_text = await extraction_service.extract_text_from_file(file_path, file_type)
        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="No readable text or spreadsheet data was found in this file")
        cleaned_text, cleaning_report = await extraction_service.clean_extracted_text_with_report(extracted_text)
        metadata = await extraction_service.extract_metadata(cleaned_text, safe_name)
        chunks = await extraction_service.chunk_text_hierarchical(cleaned_text)
        
        doc_data = {
            "organizationId": user.get("org", organizationId),
            "ownerId": user["sub"],
            "title": title or file.filename,
            "fileName": safe_name,
            "fileType": file_type,
            "s3Key": file_path,
            "fileSize": len(content),
            "processingStatus": "completed",
            "extractedText": extracted_text,
            "cleanedText": cleaned_text,
            "cleaningReport": cleaning_report,
            "pageCount": metadata.get("pageEstimate", 1),
            "wordCount": metadata.get("wordCount", 0),
            "chunks": chunks
        }
        
        document_id = await database.create_document(doc_data)
        
        return JSONResponse(
            status_code=200,
            content={
                "documentId": document_id,
                "status": "completed",
                "message": "Document uploaded, cleaned, and structure indexed",
                "wordCount": metadata.get("wordCount"),
                "pageCount": metadata.get("pageEstimate"),
                "chunkCount": len(chunks)
            }
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/v1/documents")
async def list_documents(
    organizationId: str = Query("org_default"),
    skip: int = Query(0),
    limit: int = Query(50),
    user: Dict[str, Any] = Depends(get_current_user)
):
    docs, total = await database.list_documents(
        None if is_admin(user) else user.get("org", organizationId), skip, limit,
        owner_id=None if is_admin(user) else user["sub"], include_all=is_admin(user)
    )
    documents = [
        {
            "documentId": d.get("documentId", ""),
            "title": d.get("title", ""),
            "fileName": d.get("fileName", ""),
            "fileType": d.get("fileType", ""),
            "status": d.get("processingStatus", "completed"),
            "wordCount": d.get("wordCount", 0),
            "pageCount": d.get("pageCount", 1),
            "createdAt": d.get("createdAt", datetime.utcnow()).isoformat() if isinstance(d.get("createdAt"), datetime) else str(d.get("createdAt"))
        }
        for d in docs
    ]
    return {"documents": documents, "total": total, "hasMore": skip + limit < total}


@app.get("/api/v1/history")
async def get_processing_history(skip: int = Query(0), limit: int = Query(100), user: Dict[str, Any] = Depends(get_current_user)):
    org_id = None if is_admin(user) else user.get("org", "org_default")
    owner_id = None if is_admin(user) else user["sub"]
    docs = []
    doc_skip = 0
    while True:
        page, _ = await database.list_documents(org_id, doc_skip, 500, owner_id=owner_id, include_all=is_admin(user))
        docs.extend(page)
        if len(page) < 500:
            break
        doc_skip += len(page)
    summaries = await database.list_summaries(organization_id=org_id, owner_id=owner_id)
    titles = {doc.get("documentId"): doc.get("title", doc.get("fileName", "Document")) for doc in docs}
    history = [
            *[
                {"type": "document", "documentId": doc.get("documentId"), "title": doc.get("title", doc.get("fileName", "Document")),
                 "status": doc.get("processingStatus", "completed"), "createdAt": doc.get("createdAt")}
                for doc in docs
            ],
            *[
                {"type": "summary", "summaryId": summary.get("summaryId"), "documentId": summary.get("documentId"),
                 "title": titles.get(summary.get("documentId"), "Document summary"),
                 "language": summary.get("targetLanguage", "English"), "createdAt": summary.get("createdAt")}
                for summary in summaries
            ],
        ]
    def created_at_key(item: Dict[str, Any]) -> str:
        value = item.get("createdAt")
        return value.isoformat() if isinstance(value, datetime) else str(value or "")

    history.sort(key=created_at_key, reverse=True)
    total = len(history)
    page = history[skip:skip + limit]
    return {"history": page, "total": total, "hasMore": skip + limit < total}


@app.get("/api/v1/documents/{document_id}")
async def get_document(document_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = require_document_access(await database.get_document(document_id), user)
    return {
        "documentId": doc.get("documentId", document_id),
        "title": doc.get("title", ""),
        "fileName": doc.get("fileName", ""),
        "fileType": doc.get("fileType", ""),
        "status": doc.get("processingStatus", "completed"),
        "wordCount": doc.get("wordCount", 0),
        "pageCount": doc.get("pageCount", 1),
        "cleaningReport": doc.get("cleaningReport", {}),
        "createdAt": doc.get("createdAt", datetime.utcnow()).isoformat() if isinstance(doc.get("createdAt"), datetime) else str(doc.get("createdAt"))
    }


@app.delete("/api/v1/documents/{document_id}")
async def delete_document(document_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    require_document_access(await database.get_document(document_id), user)
    success = await database.delete_document(document_id)
    return {"success": success, "message": "Document deleted"}


@app.get("/api/v1/documents/{document_id}/cleaning-report")
async def get_cleaning_report(document_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = require_document_access(await database.get_document(document_id), user)
    return {
        "documentId": document_id,
        "title": doc.get("title"),
        "rawContent": (doc.get("extractedText") or "")[:4000],
        "cleanedContent": (doc.get("cleanedText") or "")[:4000],
        "report": doc.get("cleaningReport", {})
    }


# ==================== Multi-Agent Summarization ====================

@app.post("/api/v1/summaries/generate")
async def generate_summary(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    document_id = payload.get("documentId")
    organization_id = user.get("org", "org_default")
    user_id = user["sub"]
    config = payload.get("config", {})

    doc = require_document_access(await database.get_document(document_id), user)

    text = doc.get("cleanedText") or doc.get("extractedText") or ""

    try:
        result = await multi_agent_service.execute_pipeline(
            document_id,
            organization_id,
            user_id,
            text,
            config,
            doc.get("chunks"),
        )
    except RuntimeError as error:
        if str(error).startswith(("Translation to ", "Summary generation is unavailable")):
            raise HTTPException(status_code=503, detail=str(error)) from error
        raise
    return JSONResponse(status_code=200, content=result)


@app.get("/api/v1/summaries/{summary_id}")
async def get_summary(summary_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    summary = await require_summary_access(await database.get_summary(summary_id), user)
    provider = summary.get("provider")
    if not provider:
        for stage in summary.get("trace", []):
            output = stage.get("output", "")
            marker = "provider: "
            if stage.get("stage") == "Summarization Agent" and marker in output:
                provider = output.rsplit(marker, 1)[-1].rstrip(")")
                break
    return {
        "summaryId": summary.get("summaryId", summary_id),
        "documentId": summary.get("documentId", ""),
        "type": summary.get("summaryType", "executive"),
        "targetLanguage": summary.get("targetLanguage", "English"),
        "provider": provider or "unknown",
        "content": summary.get("content", {}),
        "validation": {
            "status": summary.get("validationStatus", "valid"),
            "confidence": 0.92,
            "claims": summary.get("content", {}).get("claims", [])
        },
        "quality": {
            "relevanceScore": 92.0,
            "completenessScore": 88.0,
            "overallQualityScore": summary.get("qualityScore", 90)
        },
        "costs": {
            "extractionCost": 0.005,
            "summaryTokenCount": 650,
            "summarizationCost": summary.get("cost", 0.05),
            "validationCost": 0.01,
            "totalCost": summary.get("cost", 0.06)
        },
        "createdAt": summary.get("createdAt", datetime.utcnow()).isoformat() if isinstance(summary.get("createdAt"), datetime) else str(summary.get("createdAt"))
    }


@app.post("/api/v1/summaries/{summary_id}/translate")
async def translate_saved_summary(
    summary_id: str,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user),
):
    summary = await require_summary_access(await database.get_summary(summary_id), user)
    language = payload.get("language")
    supported_languages = {"English", "Hindi", "Tamil", "Spanish", "French", "German", "Japanese"}
    if language not in supported_languages:
        raise HTTPException(status_code=422, detail="Choose a supported summary language")
    try:
        content = await llm_service.translate_summary_content(summary.get("content", {}), language)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"targetLanguage": language, "content": content}


@app.get("/api/v1/summaries")
async def list_summaries(documentId: Optional[str] = Query(None), organizationId: Optional[str] = Query(None), user: Dict[str, Any] = Depends(get_current_user)):
    if documentId:
        require_document_access(await database.get_document(documentId), user)
    summaries = await database.list_summaries(
        documentId,
        None if is_admin(user) else user.get("org"),
        owner_id=None if is_admin(user) else user["sub"],
    )
    return {
        "summaries": [
            {
                "summaryId": s.get("summaryId", ""),
                "documentId": s.get("documentId", ""),
                "type": s.get("summaryType", "executive"),
                "qualityScore": s.get("qualityScore", 90),
                "createdAt": s.get("createdAt", datetime.utcnow()).isoformat() if isinstance(s.get("createdAt"), datetime) else str(s.get("createdAt"))
            }
            for s in summaries
        ],
        "total": len(summaries)
    }


# ==================== Audio Briefing Endpoints ====================

@app.post("/api/v1/audio/generate")
async def generate_audio(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    summary_id = payload.get("summaryId")
    language = payload.get("language", "English")
    speed = float(payload.get("speed", 1.0))
    
    summary = await database.get_summary(summary_id)
    summary = await require_summary_access(summary, user)
        
    content = summary.get("content", {})
    script = content.get("audioScript") or content.get("summary", "")
    
    result = await audio_service.generate_audio_briefing(summary_id, script, language, speed)
    return result


@app.get("/api/v1/audio/stream/{filename}")
async def stream_audio(filename: str, user: Dict[str, Any] = Depends(get_current_user)):
    if not filename.startswith("briefing_") or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=404, detail="Audio file not found")
    audio_identifier = filename[len("briefing_"):]
    summary_id = audio_identifier.rsplit("_", 1)[0].removesuffix(".mp3")
    await require_summary_access(await database.get_summary(summary_id), user)
    audio_path = os.path.join(settings.UPLOAD_DIR, "audio", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")


# ==================== Document Q&A Workspace ====================

@app.post("/api/v1/documents/{document_id}/qa")
async def document_qa(document_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    question = payload.get("question", "")
    if not isinstance(question, str) or not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    question = question.strip()
    if len(question) > 2000:
        raise HTTPException(status_code=422, detail="Question must be 2,000 characters or fewer")
        
    doc = require_document_access(await database.get_document(document_id), user)
        
    chunks = doc.get("chunks")
    if not chunks:
        text = doc.get("cleanedText") or doc.get("extractedText") or ""
        chunks = await extraction_service.chunk_text_hierarchical(text)
        
    # Trend, comparison and risk questions often need several periods or sections.
    # Retrieve a wider evidence set than a simple fact lookup.
    relevant = await retrieval_service.retrieve_relevant_chunks(question, chunks, top_k=8)
    chunk_texts = [c["text"] for c in relevant]
    
    qa_res = await llm_service.answer_question(question, chunk_texts, doc.get("title", "Document"))
    
    follow_ups = [
        "What are the major operational risks mentioned?",
        "What decisions or recommendations were made?",
        "What are the financial implications in this document?",
        "Which sections support this answer?"
    ]
    
    # Save to conversation
    conv_id = payload.get("conversationId")
    if not conv_id:
        conv_id = await database.create_conversation({
            "documentId": document_id,
            "organizationId": doc.get("organizationId", "org_default"),
            "userId": user["sub"],
            "title": f"Q&A - {question[:30]}..."
        })
        
    await database.add_message_to_conversation(conv_id, {"role": "user", "content": question})
    await database.add_message_to_conversation(conv_id, {"role": "assistant", "content": qa_res["answer"]})
    
    return {
        "conversationId": conv_id,
        "question": question,
        "answer": qa_res["answer"],
        "citations": relevant,
        "followUpSuggestions": follow_ups
    }


@app.get("/api/v1/conversations")
async def list_user_conversations(documentId: Optional[str] = Query(None), user: Dict[str, Any] = Depends(get_current_user)):
    if documentId:
        require_document_access(await database.get_document(documentId), user)
    convs = await database.list_conversations(documentId, None if is_admin(user) else user["sub"])
    return {
        "conversations": [
            {
                "conversationId": c.get("conversationId", ""),
                "documentId": c.get("documentId", ""),
                "title": c.get("title", "Document Q&A Session"),
                "messageCount": len(c.get("messages", [])),
                "updatedAt": c.get("updatedAt", datetime.utcnow()).isoformat() if isinstance(c.get("updatedAt"), datetime) else str(c.get("updatedAt")),
                "expiresInDays": 30
            }
            for c in convs
        ]
    }


# ==================== 3D Topic Clusters & Cosine Analytics ====================

@app.get("/api/v1/documents/{document_id}/topic-clusters")
async def get_topic_clusters(document_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = require_document_access(await database.get_document(document_id), user)
        
    chunks = doc.get("chunks")
    if not chunks:
        text = doc.get("cleanedText") or doc.get("extractedText") or ""
        chunks = await extraction_service.chunk_text_hierarchical(text)
        
    clusters = await retrieval_service.generate_3d_topic_clusters(chunks)
    return clusters


# ==================== Document Comparison ====================

@app.post("/api/v1/documents/compare")
async def compare_documents(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    doc_a = payload.get("documentIdA")
    doc_b = payload.get("documentIdB")
    if not doc_a or not doc_b:
        raise HTTPException(status_code=400, detail="Two document IDs are required")
    require_document_access(await database.get_document(doc_a), user)
    require_document_access(await database.get_document(doc_b), user)
    res = await comparison_service.compare_documents(doc_a, doc_b)
    return res


# ==================== DeepEval Quality & GovReport Benchmark ====================

@app.get("/api/v1/evaluations/summary")
async def evaluate_saved_summary(
    documentId: str = Query(...),
    summaryId: str = Query(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    doc = require_document_access(await database.get_document(documentId), user)
    summary = await require_summary_access(await database.get_summary(summaryId), user)
    if summary.get("documentId") != documentId:
        raise HTTPException(status_code=400, detail="The selected summary does not belong to this document")
    return evaluation_service.evaluate_document_summary(doc, summary)


@app.get("/api/v1/evaluations/govreport")
async def run_govreport_benchmark(sampleIndex: int = Query(0), user: Dict[str, Any] = Depends(get_current_user)):
    return await evaluation_service.run_govreport_benchmark(sample_index=sampleIndex)


@app.get("/api/v1/evaluations/quality")
async def get_quality_analytics(user: Dict[str, Any] = Depends(get_current_user)):
    return await evaluation_service.run_custom_dataset_eval()


# ==================== Demo Data Loader & Stress Test ====================

@app.post("/api/v1/demo/load")
async def load_demo_data(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await demo_service.load_demo_dataset(user_id=user["sub"], organization_id=user.get("org", "org_default"))
    return {"message": f"Successfully loaded {len(docs)} demo documents", "documents": docs}


@app.get("/api/v1/demo/stress-test")
async def run_stress_test():
    res = await extraction_service.generate_stress_test_document()
    return res


# ==================== Summary Export ====================

@app.get("/api/v1/summaries/{summary_id}/export")
async def export_summary(summary_id: str, format: str = Query("markdown"), user: Dict[str, Any] = Depends(get_current_user)):
    summary = await require_summary_access(await database.get_summary(summary_id), user)
        
    content = summary.get("content", {})
    title = content.get("title", "Summary")
    text_sum = content.get("summary", "")
    findings = "\n".join([f"- {f}" for f in content.get("keyFindings", [])])
    risks = "\n".join([f"- {r}" for r in content.get("risks", [])])
    recs = "\n".join([f"- {r}" for r in content.get("recommendations", [])])
    
    if format.lower() == "json":
        return JSONResponse(content=summary)
        
    md_content = f"# {title}\n\n## Executive Summary\n{text_sum}\n\n## Key Findings\n{findings}\n\n## Risks\n{risks}\n\n## Recommendations\n{recs}\n"
    
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="summary_{summary_id[:8]}.md"'}
    )


# ==================== Cost Analytics ====================

@app.get("/api/v1/organizations/{organization_id}/costs")
async def get_costs(organization_id: str, days: int = Query(30)):
    costs = await cost_service.get_organization_costs(organization_id, days)
    return {
        "period": {"days": days, "startDate": datetime.utcnow().isoformat(), "endDate": datetime.utcnow().isoformat()},
        **costs
    }


@app.get("/api/v1/organizations/{organization_id}/budget")
async def get_budget(organization_id: str):
    return await cost_service.get_budget_status(organization_id)


# Server entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.RELOAD)
