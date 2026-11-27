import { useQueryClient } from '@tanstack/react-query';
import { useSession } from './session-context';

export function useLogOut(): () => void {
  const { endSession } = useSession();
  const queryClient = useQueryClient();
  return () => {
    endSession();
    queryClient.clear();
  };
}
