import { AuthProvider } from './contexts/AuthContext';
import NicsanCRMMock from "./NicsanCRMMock";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50">
        <NicsanCRMMock />
      </div>
    </AuthProvider>
  );
}
