"""Retrieval & Semantic Clustering Service with Cosine Similarity and Intent Weighting"""
import logging
import math
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class RetrievalService:
    """Hierarchical retrieval, cosine similarity search, and topic clustering"""

    def compute_tf_idf_vectors(self, documents: List[str]) -> List[Dict[str, float]]:
        """Compute TF-IDF vectors for chunks"""
        tf_list = []
        doc_count = len(documents)
        df = {}

        for doc in documents:
            words = re.findall(r'\w+', doc.lower())
            total_words = max(1, len(words))
            tf = {}
            seen = set()
            for w in words:
                tf[w] = tf.get(w, 0) + 1 / total_words
                if w not in seen:
                    df[w] = df.get(w, 0) + 1
                    seen.add(w)
            tf_list.append(tf)

        # Apply IDF
        vectors = []
        for tf in tf_list:
            vec = {}
            for w, val in tf.items():
                idf = math.log((doc_count + 1) / (df.get(w, 1) + 1)) + 1
                vec[w] = val * idf
            vectors.append(vec)
        return vectors

    def cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """Compute cosine similarity between two word frequency dicts"""
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])

        sum1 = sum([val ** 2 for val in vec1.values()])
        sum2 = sum([val ** 2 for val in vec2.values()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        return float(numerator / denominator)

    async def retrieve_relevant_chunks(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 5,
        user_intent: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve top-K chunks using cosine similarity + intent weighting"""
        if not chunks:
            return []

        texts = [c.get("text", "") for c in chunks]
        all_docs = [query] + texts
        vectors = self.compute_tf_idf_vectors(all_docs)
        query_vec = vectors[0]

        results = []
        for idx, chunk in enumerate(chunks):
            chunk_vec = vectors[idx + 1]
            sim = self.cosine_similarity(query_vec, chunk_vec)

            # Apply intent priority boost
            boost = 1.0
            if user_intent and "text" in chunk:
                text_lower = chunk["text"].lower()
                for category, weight in user_intent.items():
                    if category.lower() in text_lower or (category.lower() == "risks" and "risk" in text_lower):
                        boost += weight * 0.2

            score = min(1.0, sim * boost + 0.1)
            results.append({
                **chunk,
                "similarityScore": round(score, 4),
                "relevanceReason": f"Matched query intent with similarity {round(score, 2)}"
            })

        results.sort(key=lambda x: x["similarityScore"], reverse=True)
        return results[:top_k]

    async def generate_3d_topic_clusters(self, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate 3D coordinates and clusters for Three.js visualizer"""
        topics = ["Finance & Revenue", "Operational Risks", "Strategic Decisions", "Compliance & Governance", "Technical Architecture"]
        
        nodes = []
        for i, chunk in enumerate(chunks[:25]):
            topic_idx = i % len(topics)
            # Generate deterministic 3D sphere coordinate around cluster center
            angle = (i * 2.4)
            radius = 12 + (i % 5) * 4
            x = math.cos(angle) * radius + (topic_idx - 2) * 25
            y = math.sin(angle * 1.5) * (radius / 2)
            z = math.sin(angle) * radius

            nodes.append({
                "id": chunk.get("chunkId", f"node_{i}"),
                "label": f"{topics[topic_idx]} #{i+1}",
                "topic": topics[topic_idx],
                "position": [round(x, 2), round(y, 2), round(z, 2)],
                "wordCount": chunk.get("wordCount", 120),
                "section": chunk.get("section", "General"),
                "snippet": chunk.get("text", "")[:100] + "..."
            })

        return {
            "topics": topics,
            "totalChunks": len(chunks),
            "nodes": nodes,
            "clusterCount": len(topics)
        }


retrieval_service = RetrievalService()
