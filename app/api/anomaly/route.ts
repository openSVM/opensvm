import { NextRequest } from 'next/server';
import { getConnection } from '@/lib/solana-connection';
import { AnomalyDetectionCapability } from '@/lib/ai/capabilities/anomaly-detection';

// Global anomaly detector instance
let anomalyDetector: AnomalyDetectionCapability | null = null;

async function getAnomalyDetector(): Promise<AnomalyDetectionCapability> {
  if (!anomalyDetector) {
    const connection = await getConnection();
    anomalyDetector = new AnomalyDetectionCapability(connection);
  }
  return anomalyDetector;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'alerts';
    
    const detector = await getAnomalyDetector();
    
    switch (action) {
      case 'alerts':
        const alerts = await detector.getAnomalyAlerts({ 
          message: { role: 'user', content: 'get alerts' },
          context: { messages: [] }
        });
        return Response.json({
          success: true,
          data: alerts
        });
        
      case 'stats':
        const stats = await detector.getAnomalyStats({
          message: { role: 'user', content: 'get stats' },
          context: { messages: [] }
        });
        return Response.json({
          success: true,
          data: stats
        });
        
      default:
        return Response.json({
          error: 'Invalid action. Use action=alerts or action=stats'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Anomaly API error:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { event, action } = await request.json();
    
    const detector = await getAnomalyDetector();
    
    switch (action) {
      case 'analyze':
        if (!event) {
          return Response.json({
            error: 'Event data is required'
          }, { status: 400 });
        }
        
        const alerts = await detector.processEvent(event);
        return Response.json({
          success: true,
          data: {
            event,
            alerts,
            anomalyCount: alerts.length
          }
        });
        
      case 'bulk_analyze':
        if (!Array.isArray(event)) {
          return Response.json({
            error: 'Events array is required for bulk analysis'
          }, { status: 400 });
        }
        
        const results = [];
        for (const evt of event) {
          const eventAlerts = await detector.processEvent(evt);
          results.push({
            event: evt,
            alerts: eventAlerts,
            anomalyCount: eventAlerts.length
          });
        }
        
        return Response.json({
          success: true,
          data: {
            processed: results.length,
            results
          }
        });
        
      default:
        return Response.json({
          error: 'Invalid action. Use action=analyze or action=bulk_analyze'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Anomaly API error:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}