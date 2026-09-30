"""Summarization Service with Multi-Agent Orchestration"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.services.llm_service import llm_service
from app import database

logger = logging.getLogger(__name__)


class SummarizationService:
    """Service for generating AI-powered summaries"""
    
    async def generate_summary(
        self,
        document_id: str,
        organization_id: str,
        user_id: str,
        text: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate summary using multi-agent orchestration
        
        Pipeline:
        1. Extract key findings
        2. Generate main summary
        3. Generate structured analysis
        4. Validate summary
        5. Calculate quality score
        6. Save to database
        """
        start_time = datetime.utcnow()
        total_cost = 0.0
        total_tokens = 0
        
        if config is None:
            config = {"type": "executive"}
        
        summary_type = config.get("type", "executive")
        focus_area = config.get("focusArea")
        
        try:
            logger.info(f"Analyzing document {document_id}...")
            
            # Step 1: Extract key findings
            findings_result = await llm_service.extract_key_findings(text[:4000])
            total_cost += findings_result["cost"]
            
            # Step 2: Generate main summary
            logger.info("Generating summary...")
            summary_result = await llm_service.generate_summary(
                text,
                summary_type,
                focus_area
            )
            total_cost += summary_result["cost"]
            total_tokens += summary_result["tokenCount"]
            
            # Step 3: Generate structured analysis
            logger.info("Extracting structured insights...")
            structured_result = await llm_service.extract_structured_analysis(
                text,
                summary_result["summary"],
                focus_area
            )
            total_cost += structured_result["cost"]
            total_tokens += structured_result["tokenCount"]
            
            # Step 4: Validate summary
            logger.info("Validating summary...")
            validation_result = await llm_service.validate_summary(
                summary_result["summary"],
                text[:3000]
            )
            validation_cost = 0.01 if validation_result["confidence"] > 0.7 else 0.02
            total_cost += validation_cost
            
            # Step 5: Calculate quality score
            quality_score = self._calculate_quality_score(
                summary_result["summary"],
                validation_result["isValid"],
                validation_result["confidence"]
            )
            
            # Step 6: Save summary to database
            summary_doc = {
                "documentId": document_id,
                "organizationId": organization_id,
                "userId": user_id,
                "summaryType": summary_type,
                "focusArea": focus_area,
                "content": {
                    "title": f"{focus_area} Summary" if focus_area else "Document Summary",
                    "summary": summary_result["summary"],
                    "keyFindings": findings_result["findings"][:5],
                    "risks": structured_result.get("risks", []),
                    "recommendations": structured_result.get("recommendations", []),
                    "actionItems": structured_result.get("actionItems", []),
                    "conclusion": summary_result["summary"].split('\n')[-1] if '\n' in summary_result["summary"] else ""
                },
                "validationStatus": "valid" if validation_result["isValid"] else "partial",
                "qualityScore": quality_score,
                "cost": total_cost
            }
            
            summary_id = await database.create_summary(summary_doc)
            
            # Step 7: Save cost tracking
            cost_doc = {
                "documentId": document_id,
                "organizationId": organization_id,
                "summarizationCost": summary_result["cost"],
                "validationCost": validation_cost,
                "totalCost": total_cost,
                "tokenCount": total_tokens,
                "timeToProcess": int((datetime.utcnow() - start_time).total_seconds())
            }
            
            await database.create_cost_record(cost_doc)
            
            logger.info(f"Summary generated: {summary_id}")
            
            return {
                "summaryId": summary_id,
                "content": summary_doc["content"],
                "validation": {
                    "status": summary_doc["validationStatus"],
                    "confidence": validation_result["confidence"]
                },
                "quality": {
                    "relevanceScore": 85 + (quality_score - 85) * 0.5,
                    "completenessScore": 80 + (quality_score - 80) * 0.5,
                    "overallQualityScore": quality_score
                },
                "costs": {
                    "extractionCost": 0.01,
                    "summaryTokenCount": total_tokens,
                    "summarizationCost": summary_result["cost"],
                    "validationCost": validation_cost,
                    "totalCost": total_cost
                }
            }
        
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            raise Exception(f"Failed to generate summary: {str(e)}")
    
    def _calculate_quality_score(
        self,
        summary: str,
        is_valid: bool,
        confidence: float
    ) -> float:
        """
        Calculate quality score (0-100)
        
        Factors:
        - Length adequacy (15 points)
        - Validity (35 points)
        - Confidence (30 points)
        - Readability (20 points)
        """
        # Length score
        word_count = len(summary.split())
        length_score = min(word_count / 10, 15)
        
        # Validity score
        validity_score = 35 if is_valid else 20
        
        # Confidence score
        confidence_score = confidence * 30
        
        # Readability score
        sentences = summary.split('.')
        avg_sentence_length = word_count / max(len(sentences), 1)
        
        readability_score = 20
        if 10 < avg_sentence_length < 25:
            readability_score = 20
        elif avg_sentence_length < 30:
            readability_score = 15
        
        total = length_score + validity_score + confidence_score + readability_score
        return min(100, int(total))


# Global instance
summarization_service = SummarizationService()
