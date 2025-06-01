import { Builder, ScheduleItem } from '.';
import { Card, CardContent } from '@/components/ui/card';

interface TimelineProps {
  schedule: ScheduleItem[];
  builders: Builder[];
  selectedScheduleTasks: Record<string, number>;
  firstCheckedTaskIndices: Record<string, number>;
}

export default function Timeline({
  schedule,
  builders,
  selectedScheduleTasks,
  firstCheckedTaskIndices
}: TimelineProps) {
  // Group schedule by builder
  const getBuilderSchedules = () => {
    const builderSchedules: Record<string, ScheduleItem[]> = {};
    schedule.forEach(item => {
      const builderId = item.builderId.toString();
      if (!builderSchedules[builderId]) {
        builderSchedules[builderId] = [];
      }
      builderSchedules[builderId].push(item);
    });
    return builderSchedules;
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'defense': 
        return (
          <svg className="w-5 h-5 text-rose-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
          </svg>
        );
      case 'resource': 
        return (
          <svg className="w-5 h-5 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'army': 
        return (
          <svg className="w-5 h-5 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        );
      case 'wall': 
        return (
          <svg className="w-5 h-5 text-sky-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
        );
      default: 
        return (
          <svg className="w-5 h-5 text-slate-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
          </svg>
        );
    }
  };

  // Create a timeline task item
  const createTimelineTaskItem = (item: ScheduleItem, index: number, totalItems: number) => {
    // Determine status class
    let statusClass = 'bg-amber-900/30 text-amber-200/90 border border-amber-700/30'; // Default: In progress
    let statusText = 'Sedang';
    
    if (index === 0) {
      statusClass = 'bg-emerald-900/30 text-emerald-200/90 border border-emerald-700/30';
      statusText = 'Aktif';
    } else if (index === totalItems - 1) {
      statusClass = 'bg-sky-900/30 text-sky-200/90 border border-sky-700/30';
      statusText = 'Terakhir';
    }
    
    // Format dates for display
    const startDate = new Date(item.startTime).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit'
    });
    
    const startTime = new Date(item.startTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endDate = new Date(item.endTime).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit'
    });
    
    const endTime = new Date(item.endTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div key={item.buildingId} className="relative bg-[#1d1040]/50 rounded-lg border border-[#2a1b4a] shadow-sm p-4 transition-all hover:shadow-md hover:bg-[#1d1040]/70 mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getCategoryIcon(item.buildingCategory)}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-medium text-white">{item.buildingName}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
                {statusText}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-1 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {startDate} {startTime}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-1 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {item.durationText}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-1 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                {item.builderName}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-1 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
                {endDate} {endTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create a builder timeline section
  const createBuilderTimelineSection = (builderId: string, builderItems: ScheduleItem[]) => {
    if (!builderItems || builderItems.length === 0) return null;
    
    const baseBuilderName = builderItems[0].builderName;
    
    // Get the builder's initial task from builder status
    const builder = builders.find(b => b.id === parseInt(builderId));
    const initialTask = builder ? builder.currentTask : null;
    
    // Determine the builder display name
    let builderDisplayName = baseBuilderName;
    
    // If we have a selected task for this builder, use that for the name
    if (selectedScheduleTasks[builderId]) {
      const selectedTask = builderItems.find(item => item.buildingId === selectedScheduleTasks[builderId]);
      if (selectedTask) {
        builderDisplayName = `${baseBuilderName} - ${selectedTask.buildingName}`;
      }
    // Otherwise, if there's an initial task from builder status, use that
    } else if (initialTask) {
      builderDisplayName = `${baseBuilderName} - ${initialTask}`;
    }

    return (
      <Card key={builderId} className="mb-6 bg-[#1d1040]/30 border-[#2a1b4a]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="font-medium text-white flex items-center"
              id={`timelineBuilderHeader_${builderId}`}
            >
              <svg className="w-5 h-5 mr-2 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              {builderDisplayName}
            </h3>
            <span className="text-xs font-medium bg-purple-900/30 text-purple-200/90 py-1 px-3 rounded-full border border-purple-700/30">
              {builderItems.length} tasks
            </span>
          </div>
          
          <div className="space-y-4 mt-3">
            {builderItems.map((item, index) => createTimelineTaskItem(item, index, builderItems.length))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (schedule.length === 0 || Object.keys(selectedScheduleTasks).length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto text-gray-600/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <p>Belum ada timeline yang dibuat</p>
        <p className="text-sm mt-1 text-gray-500">Pilih task pada jadwal untuk melihat timeline</p>
      </div>
    );
  }

  const builderSchedules = getBuilderSchedules();
  
  return (
    <div className="space-y-6">
      {Object.keys(selectedScheduleTasks).map(builderId => {
        const builderItems = builderSchedules[builderId] || [];
        const firstCheckedIndex = firstCheckedTaskIndices[builderId] || 0;
        
        // If no items or invalid index, skip
        if (builderItems.length === 0 || firstCheckedIndex >= builderItems.length) {
          return null;
        }
        
        // Get tasks from the first checked one to the end
        const tasksToShow = builderItems.slice(firstCheckedIndex);
        
        return createBuilderTimelineSection(builderId, tasksToShow);
      })}
    </div>
  );
} 