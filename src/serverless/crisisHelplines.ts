import { INITIAL_CRISIS_HELPLINES } from '../data/crisisHelplines';
import { CrisisHelplineConfigModel, type StoredCrisisHelpline } from './auth';

export async function loadCrisisHelplines(): Promise<StoredCrisisHelpline[]> {
  const config = await CrisisHelplineConfigModel.findOneAndUpdate(
    { id: 'crisis-helplines' },
    { $setOnInsert: { helplines: INITIAL_CRISIS_HELPLINES } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<{ helplines: StoredCrisisHelpline[] }>();
  return config?.helplines || [];
}
