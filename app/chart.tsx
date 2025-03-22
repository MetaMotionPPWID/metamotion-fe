import { fetchData } from "@/api_service/api_service";
import { useEffect, useState } from "react";
import { BarChart } from "react-native-gifted-charts";

export default function Chart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDataAsync = async () => {
      const motionData = await fetchData();
      const accelerationData = motionData.samples[0].acceleration.map(
        (sample) => ({
          value: sample,
        })
      );
      setData(accelerationData);
    };

    fetchDataAsync();
  }, []);

  return (
    <>
      <BarChart data={data} />
    </>
  );
}
