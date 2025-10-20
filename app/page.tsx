import Timeline from './components/timeline/Timeline';
import Toolbar from './components/toolbar/Toolbar';

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Timeline />
      </div>
    </div>
  );
}
