import { Building } from '.';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';

interface BuildingQueueProps {
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  saveToLocalStorage: (buildings: Building[]) => void;
}

export default function BuildingQueue({
  buildings,
  setBuildings,
  saveToLocalStorage: saveToStorage
}: BuildingQueueProps) {
  // Remove building from queue
  const removeBuilding = (baseName: string, category: string, duration: number) => {
    // Find all buildings that match these criteria
    const matchingBuildings = buildings.filter(building => {
      // Extract base name from building name (removing any (x/y) suffix)
      const buildingBaseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
      return buildingBaseName === baseName && 
             building.category === category && 
             building.duration === duration;
    });
    
    if (matchingBuildings.length > 1) {
      // If there are multiple buildings, ask if user wants to remove all or just one
      const confirmAll = confirm(`Hapus semua ${matchingBuildings.length} bangunan "${baseName}" atau hanya satu?\n\nKlik OK untuk menghapus semua, Batal untuk menghapus satu.`);
      
      if (confirmAll) {
        // Remove all matching buildings
        const newBuildings = buildings.filter(building => {
          const buildingBaseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
          return !(buildingBaseName === baseName && 
                 building.category === category && 
                 building.duration === duration);
        });
        setBuildings(newBuildings);
        saveToStorage(newBuildings);
      } else {
        // Remove just one (the first one found)
        const indexToRemove = buildings.findIndex(building => {
          const buildingBaseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
          return buildingBaseName === baseName && 
                 building.category === category && 
                 building.duration === duration;
        });
        
        if (indexToRemove !== -1) {
          const newBuildings = [...buildings];
          newBuildings.splice(indexToRemove, 1);
          setBuildings(newBuildings);
          saveToStorage(newBuildings);
        }
      }
    } else {
      // If there's only one, remove it directly
      const newBuildings = buildings.filter(building => {
        const buildingBaseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
        return !(buildingBaseName === baseName && 
               building.category === category && 
               building.duration === duration);
      });
      setBuildings(newBuildings);
      saveToStorage(newBuildings);
    }
  };

  // Group buildings by name and category for quantity display
  const groupBuildings = () => {
    const groupedBuildings: Record<string, { baseBuilding: Building, count: number }> = {};

    buildings.forEach(building => {
      // Create a key that doesn't include the (x/y) part if it exists
      const baseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
      const key = `${baseName}-${building.category}-${building.duration}`;
      
      if (!groupedBuildings[key]) {
        groupedBuildings[key] = {
          baseBuilding: {...building},
          count: 1
        };
        // Store the base name without the (x/y) suffix
        groupedBuildings[key].baseBuilding.baseName = baseName;
      } else {
        groupedBuildings[key].count++;
      }
    });
    
    return Object.values(groupedBuildings);
  };

  // Get category color and name
  const getCategoryInfo = (category: string) => {
    switch(category) {
      case 'defense': 
        return { 
          color: 'border-l-4 border-rose-500/40',
          name: 'Pertahanan'
        };
      case 'resource': 
        return { 
          color: 'border-l-4 border-amber-500/40',
          name: 'Sumber Daya'
        };
      case 'army': 
        return { 
          color: 'border-l-4 border-purple-500/40',
          name: 'Pasukan'
        };
      case 'wall': 
        return { 
          color: 'border-l-4 border-sky-500/40',
          name: 'Dinding'
        };
      default: 
        return { 
          color: 'border-l-4 border-slate-500/40',
          name: 'Lainnya'
        };
    }
  };

  // Get priority badge
  const getPriorityInfo = (priority: string) => {
    switch(priority) {
      case 'high': 
        return { 
          badge: 'bg-rose-900/30 text-rose-200/90 border border-rose-700/30',
          name: 'Tinggi'
        };
      case 'medium': 
        return { 
          badge: 'bg-amber-900/30 text-amber-200/90 border border-amber-700/30',
          name: 'Sedang'
        };
      case 'low': 
        return { 
          badge: 'bg-emerald-900/30 text-emerald-200/90 border border-emerald-700/30',
          name: 'Rendah'
        };
      default:
        return { 
          badge: 'bg-slate-900/30 text-slate-200/90 border border-slate-700/30',
          name: 'Normal'
        };
    }
  };

  const groupedBuildings = groupBuildings();

  if (buildings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto text-gray-600/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <p>Belum ada bangunan dalam antrean</p>
        <p className="text-sm mt-1 text-gray-500">Tambahkan bangunan untuk memulai perencanaan</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-[#2a1b4a]">
            <TableHead className="text-gray-300">Bangunan</TableHead>
            <TableHead className="text-gray-300">Durasi</TableHead>
            <TableHead className="text-gray-300">Prioritas</TableHead>
            <TableHead className="text-right text-gray-300">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedBuildings.map((group) => {
            const building = group.baseBuilding;
            const count = group.count;
            const baseName = building.baseName || building.name;
            const categoryInfo = getCategoryInfo(building.category);
            const priorityInfo = getPriorityInfo(building.priority);
            
            return (
              <TableRow key={`${baseName}-${building.category}-${building.duration}`} className={`hover:bg-[#1d1040]/30 transition-colors ${categoryInfo.color} border-b border-[#2a1b4a]/50`}>
                <TableCell>
                  <div className="font-medium text-white">
                    {baseName}
                    {count > 1 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-900/30 text-purple-200/90 text-xs rounded-full border border-purple-700/30" title={`${count} identical buildings of the same level`}>
                        x{count}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{categoryInfo.name}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-300">{building.durationText}</div>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 text-xs rounded-full ${priorityInfo.badge}`}>
                    {priorityInfo.name}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeBuilding(baseName, building.category, building.duration)}
                    className="text-rose-400/80 hover:text-rose-300 transition-colors p-1 rounded-full hover:bg-rose-900/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 