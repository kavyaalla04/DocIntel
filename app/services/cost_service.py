"""Cost Tracking and ROI Service"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app import database

logger = logging.getLogger(__name__)


class CostService:
    """Service for cost tracking and ROI calculation"""
    
    def estimate_reading_time(
        self,
        word_count: int,
        words_per_minute: int = 200
    ) -> int:
        """Estimate reading time in minutes"""
        return max(1, (word_count + words_per_minute - 1) // words_per_minute)
    
    def calculate_business_value(
        self,
        time_saved_minutes: int,
        hourly_rate: float = 50.0
    ) -> Dict[str, float]:
        """Calculate business value from time saved"""
        time_saved_hours = time_saved_minutes / 60
        value_usd = time_saved_hours * hourly_rate
        
        return {
            "timeSavedHours": round(time_saved_hours, 2),
            "valueInUSD": round(value_usd, 2)
        }
    
    def calculate_roi(
        self,
        total_cost: float,
        time_saved_minutes: int,
        hourly_rate: float = 50.0
    ) -> Dict[str, Any]:
        """Calculate ROI metrics"""
        value = self.calculate_business_value(time_saved_minutes, hourly_rate)
        value_usd = value["valueInUSD"]
        
        profit = value_usd - total_cost
        roi_percentage = (profit / (total_cost or 1)) * 100
        roi_multiple = value_usd / (total_cost or 1)
        
        return {
            "roi": round(roi_percentage, 2),
            "breakeven": "Profitable" if profit > 0 else "Needs review",
            "roi_multiple": round(roi_multiple, 2)
        }
    
    async def get_organization_costs(
        self,
        organization_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get organization cost summary for last N days"""
        costs, document_count = await database.get_organization_costs(organization_id, days)
        
        if not costs:
            return {
                "totalCost": 0,
                "averageCostPerDocument": 0,
                "documentCount": 0,
                "costBreakdown": {
                    "extractionCost": 0,
                    "embeddingCost": 0,
                    "summarizationCost": 0,
                    "validationCost": 0,
                    "ttsCost": 0
                },
                "roi": {
                    "totalTimeSaved": 0,
                    "estimatedValue": 0,
                    "roiMultiple": 0
                }
            }
        
        # Aggregate costs
        total_cost = sum(c.get("totalCost", 0) for c in costs)
        
        cost_breakdown = {
            "extractionCost": sum(c.get("extractionCost", 0) for c in costs),
            "embeddingCost": sum(c.get("embeddingCost", 0) for c in costs),
            "summarizationCost": sum(c.get("summarizationCost", 0) for c in costs),
            "validationCost": sum(c.get("validationCost", 0) for c in costs),
            "ttsCost": sum(c.get("ttsCost", 0) for c in costs)
        }
        
        # ROI calculation (assume 30 min per document)
        total_time_saved = document_count * 30
        value = self.calculate_business_value(total_time_saved, 50)
        roi_multiple = value["valueInUSD"] / (total_cost or 1)
        
        return {
            "totalCost": round(total_cost, 2),
            "averageCostPerDocument": round(total_cost / max(document_count, 1), 2),
            "documentCount": document_count,
            "costBreakdown": {
                k: round(v, 2) for k, v in cost_breakdown.items()
            },
            "roi": {
                "totalTimeSaved": total_time_saved,
                "estimatedValue": round(value["valueInUSD"], 2),
                "roiMultiple": round(roi_multiple, 2)
            }
        }
    
    async def get_budget_status(
        self,
        organization_id: str,
        monthly_budget: float = 100.0
    ) -> Dict[str, Any]:
        """Get budget status for organization"""
        costs = await self.get_organization_costs(organization_id, 30)
        spent = costs["totalCost"]
        remaining = monthly_budget - spent
        percent_used = (spent / monthly_budget * 100) if monthly_budget > 0 else 0
        
        alerts: List[Dict[str, str]] = []
        
        if percent_used > 90:
            alerts.append({
                "type": "budget_critical",
                "message": "You have used 90% of your monthly budget",
                "severity": "critical"
            })
        elif percent_used > 75:
            alerts.append({
                "type": "budget_warning",
                "message": "You have used 75% of your monthly budget",
                "severity": "warning"
            })
        
        return {
            "monthlyBudget": round(monthly_budget, 2),
            "spent": round(spent, 2),
            "remaining": round(max(0, remaining), 2),
            "percentUsed": round(percent_used, 1),
            "alerts": alerts
        }
    
    def estimate_processing_cost(
        self,
        word_count: int,
        summary_type: str = "executive"
    ) -> Dict[str, float]:
        """Estimate cost for processing a document"""
        # ~1.3 tokens per word
        token_count = int(word_count * 1.3)
        
        # Cost per 1M tokens
        extraction_cost = (token_count / 1_000_000) * 0.01
        summarization_cost = (token_count / 1_000_000) * (0.05 if summary_type == "executive" else 0.08)
        validation_cost = (token_count / 1_000_000) * 0.02
        
        total_cost = extraction_cost + summarization_cost + validation_cost
        
        return {
            "extractionEstimate": round(extraction_cost, 4),
            "summarizationEstimate": round(summarization_cost, 4),
            "validationEstimate": round(validation_cost, 4),
            "totalEstimate": round(total_cost, 4)
        }
    
    async def get_cost_optimizations(
        self,
        organization_id: str
    ) -> List[str]:
        """Get cost optimization suggestions"""
        costs = await self.get_organization_costs(organization_id, 30)
        suggestions: List[str] = []
        
        total = costs["totalCost"]
        
        # Analyze breakdown
        if costs["costBreakdown"]["ttsCost"] > total * 0.3:
            suggestions.append("Consider reducing audio generation for long documents")
        
        if costs["costBreakdown"]["validationCost"] > total * 0.2:
            suggestions.append("Use faster validation for less critical documents")
        
        if costs["documentCount"] > 50 and costs["roi"]["roiMultiple"] < 2:
            suggestions.append("Consider batch processing to reduce per-document costs")
        
        if not suggestions:
            suggestions.append("Your cost structure is optimized")
        
        return suggestions


# Global instance
cost_service = CostService()
