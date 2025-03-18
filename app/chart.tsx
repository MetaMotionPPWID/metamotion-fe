import { BarChart, LineChart, PieChart, PopulationPyramid, RadarChart } from "react-native-gifted-charts";

export default function Chart() {
    const data = [{value: 15}, {value: 30}, {value: 26}, {value: 40}];

    return (
        <>
            return <BarChart data={data}/>;
        </>
    )
}