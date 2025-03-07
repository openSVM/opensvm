// Export all AI custom actions
import { aiActions } from '@/components/ai/actions';

/**
 * Get a custom AI action by name
 */
export function getActionByName(name: string) {
  return aiActions.find(action => action.name === name);
}

/**
 * Execute a custom AI action
 */
export async function executeAction(actionName: string, params: any, context: any) {
  const action = getActionByName(actionName);
  if (!action) {
    throw new Error(`Action not found: ${actionName}`);
  }
  
  try {
    return await action.execute({ params, ...context });
  } catch (error) {
    console.error(`Error executing action ${actionName}:`, error);
    throw error;
  }
}
