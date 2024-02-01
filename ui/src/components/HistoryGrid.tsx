import { baseState, minaEvent } from '@/lib/struct/base.js';

interface HistoryProps {
  state: baseState;
  fetched_event: minaEvent[];
}

export default function HistoryGrid(props: HistoryProps) {


  return (<div className="bg-white p-6 rounded-lg shadow-md ">
    <h1 className="text-2xl font-semibold mb-4">Events</h1>

    <table className="min-w-full">
      <thead>
        <tr>
          <th className="py-2">#</th>
          <th className="py-2">Player</th>
          <th className="py-2">Score</th>
        </tr>
      </thead>
      <tbody>
        {props.fetched_event.map((x, k) => {
          return (
            <tr className="bg-green-100" key={'history_' + k.toString()}>
              <td className="py-2">{x.type}</td>
              <td className="py-2">{JSON.stringify(x.event.data)}</td>
              <td className="py-2">ok</td>
            </tr>
          );
        }
        )}

      </tbody>
    </table>
  </div>);
}
