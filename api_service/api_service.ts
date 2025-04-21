import axios from 'axios';

interface Sample {
  timestamp: number;
  label: string;
  watchOnHand: "left" | "right";
  acceleration: number[];
  gyroscope: number[];
}

interface MockData {
  mac: string;
  name: string;
  samples: Sample[];
}

export const fetchData = async (): Promise<MockData> => {
  //axios.get('https://api.example.com/mock-data');
  try {
    const mockData: MockData = {
      mac: "AB:CD:EF:12:34:56",
      name: "Janek Iphone 6S",
      samples: [
        {
          timestamp: 12341234,
          label: "sitting",
          watchOnHand: "left", 
          acceleration: [1.23, -12.4, 8.12],
          gyroscope: [1.23, -12.4, 8.12],
        },
      ],
    };
    return mockData;

  } catch (error) {
    console.error('Error fetching mock data:', error);
    throw error;
  }
};


