import React from 'react';
import { FileText } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';
import type { ProjectInfo } from '../types/dataset';

interface ProjectInfoProps {
  info: ProjectInfo;
}

export function ProjectInfo() {
  const { data } = useDatasetContext();
  
  const info = {
    title: `Regression Analysis of "${data?.dataset?.metadata?.project_name || 'Untitled Project'}"`,
    description: data?.metadata?.description ?? 'Analysis of dataset correlations and relationships',
    lastUpdated: new Date().toLocaleDateString()
  };

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-[#2C5265]" />
        <h2 className="text-2xl font-bold text-[#2C5265]">{info.title}</h2>
      </div>
      <p className="text-[#1D131E] mb-4">{info.description}</p>
      <p className="text-sm text-[#7984A5]">Last updated: {info.lastUpdated}</p>
    </div>
  );
}