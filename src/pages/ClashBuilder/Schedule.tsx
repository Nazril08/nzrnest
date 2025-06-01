import { Builder, ScheduleItem } from '.';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface ScheduleProps {
  schedule: ScheduleItem[];
  builders: Builder[];
  selectedScheduleTasks: Record<string, number>;
  setSelectedScheduleTasks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  firstCheckedTaskIndices: Record<string, number>;
  setFirstCheckedTaskIndices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  saveToLocalStorage: () => void;
}

export default function Schedule({
  schedule,
  builders,
  selectedScheduleTasks,
  setSelectedScheduleTasks,
  firstCheckedTaskIndices,
  setFirstCheckedTaskIndices,
  saveToLocalStorage: saveToStorage
}: ScheduleProps) {
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle schedule task selection (checkbox change)
  const handleScheduleTaskSelection = (
    builderId: number, 
    buildingId: number, 
    buildingName: string, 
    taskIndex: number
  ) => {
    const builderIdStr = builderId.toString();
    
    // Check if this task is already selected
    const isSelected = selectedScheduleTasks[builderIdStr] === buildingId;
    
    // Create new selected tasks object
    const newSelectedTasks = { ...selectedScheduleTasks };
    const newFirstCheckedIndices = { ...firstCheckedTaskIndices };
    
    if (isSelected) {
      // If already selected, unselect it
      delete newSelectedTasks[builderIdStr];
      delete newFirstCheckedIndices[builderIdStr];
    } else {
      // Otherwise select it and store the index
      newSelectedTasks[builderIdStr] = buildingId;
      newFirstCheckedIndices[builderIdStr] = taskIndex;
    }
    
    // Update state
    setSelectedScheduleTasks(newSelectedTasks);
    setFirstCheckedTaskIndices(newFirstCheckedIndices);
    
    // Save to storage
    saveToStorage();
  };

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
          <svg className="w-4 h-4 text-rose-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
          </svg>
        );
      case 'resource': 
        return (
          <svg className="w-4 h-4 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'army': 
        return (
          <svg className="w-4 h-4 text-purple-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        );
      case 'wall': 
        return (
          <svg className="w-4 h-4 text-sky-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
        );
      default: 
        return (
          <svg className="w-4 h-4 text-slate-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
          </svg>
        );
    }
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto text-gray-600/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p>Belum ada jadwal yang dibuat</p>
        <p className="text-sm mt-1 text-gray-500">Klik "Generate Schedule" untuk membuat jadwal</p>
      </div>
    );
  }

  const builderSchedules = getBuilderSchedules();

  return (
    <div className="space-y-4">
      {Object.keys(builderSchedules).map(builderId => {
        const builderItems = builderSchedules[builderId];
        const builder = builders.find(b => b.id === parseInt(builderId));
        const initialTask = builder ? builder.currentTask : null;
        
        // Determine the builder display name
        const baseBuilderName = builderItems[0].builderName;
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
          <Card key={builderId} className="bg-[#1d1040]/30 border-[#2a1b4a]">
            <CardContent className="p-4">
              <h3 
                id={`builderScheduleHeader_${builderId}`} 
                className="font-semibold text-white mb-2 flex items-center"
              >
                <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                {builderDisplayName}
              </h3>
              
              <ul className="space-y-2">
                {builderItems.map((item, index) => (
                  <li 
                    key={item.buildingId} 
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      item.isGoodTime 
                        ? 'bg-[#2a1b4a]/60 border border-emerald-700/30' 
                        : 'bg-[#2a1b4a]/60 border border-amber-700/30'
                    }`}
                  >
                    <Checkbox
                      id={`scheduleTask_${builderId}_${item.buildingId}`}
                      checked={selectedScheduleTasks[builderId] === item.buildingId}
                      onCheckedChange={() => handleScheduleTaskSelection(
                        item.builderId, 
                        item.buildingId, 
                        item.buildingName, 
                        index
                      )}
                      className="h-4 w-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    
                    <div className="flex-shrink-0 ml-2">
                      {getCategoryIcon(item.buildingCategory)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="font-medium text-white">{item.buildingName}</div>
                      <div className="text-xs text-gray-400">
                        {formatDate(item.startTime)} - {formatDate(item.endTime)} ({item.durationText})
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isGoodTime 
                          ? 'bg-emerald-900/30 text-emerald-200/90 border border-emerald-700/30' 
                          : 'bg-amber-900/30 text-amber-200/90 border border-amber-700/30'
                      }`}>
                        {item.isGoodTime ? 'Optimal' : 'Suboptimal'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 