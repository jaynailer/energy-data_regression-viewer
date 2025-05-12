export interface WeatherStation {
  contribution: number;
  distance: number;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  quality: number;
  useCount: number;
}

export interface DatasetMetadata {
  title: string;
  description: string;
  lat: string;
  lon: string;
  stations: {
    [key: string]: WeatherStation;
  };
}

export interface DatasetResponse {
  data: any;
  metadata: DatasetMetadata;
}

export interface ProjectInfo {
  title: string;
  description: string;
  lastUpdated: string;
}