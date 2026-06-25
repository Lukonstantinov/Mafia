import { useStore } from './store';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { RoleCreator } from './screens/RoleCreator';
import { NightOrder } from './screens/NightOrder';
import { Settings } from './screens/Settings';
import { Assign } from './screens/Assign';
import { Tally } from './screens/Tally';
import { Deal } from './screens/Deal';
import { Gate } from './screens/Gate';
import { Table } from './screens/Table';

export default function App() {
  const screen = useStore((s) => s.screen);
  switch (screen) {
    case 'home': return <Home />;
    case 'setup': return <Setup />;
    case 'roleCreator': return <RoleCreator />;
    case 'nightOrder': return <NightOrder />;
    case 'settings': return <Settings />;
    case 'assign': return <Assign />;
    case 'tally': return <Tally />;
    case 'deal': return <Deal />;
    case 'gate': return <Gate />;
    case 'table': return <Table />;
    default: return <Home />;
  }
}
