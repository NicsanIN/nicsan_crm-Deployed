import { AuthProvider } from './contexts/AuthContext';
import { CrossDeviceSyncProvider } from './components/CrossDeviceSyncProvider';
import NicsanCRMMock from "./NicsanCRMMock";

export default function App() {
  return (
    <AuthProvider>
      <CrossDeviceSyncProvider>
        <div className="min-h-screen bg-zinc-50">
          <NicsanCRMMock />
        </div>
      </CrossDeviceSyncProvider>
    </AuthProvider>
  );
}
