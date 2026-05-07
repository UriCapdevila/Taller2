import { useState } from 'react';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
import { useDataset } from './hooks/useDataset';

export default function App() {
  const [activeTab, setActiveTab] = useState(1);
  const [cache, setCache] = useState(new Map());

  const { data, loading, error } = useDataset(activeTab, cache, setCache);

  return (
    <div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <TabContent data={data} loading={loading} error={error} />
    </div>
  );
}
