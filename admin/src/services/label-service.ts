import { LabelNode } from '@interfaces/label';
import { ApiResponse, apiService } from '@services/api-service';

export const getLabels = async (municipalityId: number, namespace: string) => {
  return apiService.get<ApiResponse<LabelNode[]>>(`/labels/${municipalityId}/${namespace}`);
};

export const saveLabels = async (
  municipalityId: number,
  namespace: string,
  labelStructure: LabelNode[],
  isNew: boolean
) => {
  const method = isNew ? apiService.post : apiService.put;
  return method<ApiResponse<LabelNode[]>>(`/labels/${municipalityId}/${namespace}`, { labelStructure });
};
