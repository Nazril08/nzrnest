import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import buildingsData from '@/data/buildings.json';
import resourcesData from '@/data/resources.json';
import { Building as BuildingType } from './index';

interface Building {
  Level: number;
  "Damage per Second"?: number;
  "Damage per Attack"?: number;
  "Damage per Shot"?: number;
  "Push Strength"?: string;
  "Storage Capacity"?: string | number;
  Hitpoints: number | string;
  Cost: string;
  "Build Time": string;
  "Experience Gained": number | string;
  "Town Hall Level Required": number;
  buildingType?: string; // Added to store the building type
}

interface TownHallBuildingsProps {
  buildings: BuildingType[];
  setBuildings: React.Dispatch<React.SetStateAction<BuildingType[]>>;
  saveToLocalStorage: (buildings: BuildingType[]) => void;
}

// Define building categories
const CATEGORIES = {
  ALL: "All",
  DEFENSE: "Defense",
  RESOURCE: "Resource",
  ARMY: "Army",
  TRAP: "Trap",
  OTHER: "Other"
};

// Map building types to categories
const BUILDING_CATEGORIES: Record<string, string> = {
  "Air_Defense": CATEGORIES.DEFENSE,
  "Mortar": CATEGORIES.DEFENSE,
  "Cannon": CATEGORIES.DEFENSE,
  "Archer_Tower": CATEGORIES.DEFENSE,
  "Wizard_Tower": CATEGORIES.DEFENSE,
  "X_Bow": CATEGORIES.DEFENSE,
  "Inferno_Tower": CATEGORIES.DEFENSE,
  "Eagle_Artillery": CATEGORIES.DEFENSE,
  "Bomb_Tower": CATEGORIES.DEFENSE,
  "Hidden_Tesla": CATEGORIES.DEFENSE,
  "Scattershot": CATEGORIES.DEFENSE,
  "Air_Sweeper": CATEGORIES.DEFENSE,
  
  "Gold_Mine": CATEGORIES.RESOURCE,
  "Elixir_Collector": CATEGORIES.RESOURCE,
  "Dark_Elixir_Drill": CATEGORIES.RESOURCE,
  "Gold_Storage": CATEGORIES.RESOURCE,
  "Elixir_Storage": CATEGORIES.RESOURCE,
  "Dark_Elixir_Storage": CATEGORIES.RESOURCE,
  
  "Army_Camp": CATEGORIES.ARMY,
  "Barracks": CATEGORIES.ARMY,
  "Dark_Barracks": CATEGORIES.ARMY,
  "Laboratory": CATEGORIES.ARMY,
  "Spell_Factory": CATEGORIES.ARMY,
  "Dark_Spell_Factory": CATEGORIES.ARMY,
  "Workshop": CATEGORIES.ARMY,
  "Pet_House": CATEGORIES.ARMY,
  
  "Bomb": CATEGORIES.TRAP,
  "Spring_Trap": CATEGORIES.TRAP,
  "Air_Bomb": CATEGORIES.TRAP,
  "Giant_Bomb": CATEGORIES.TRAP,
  "Seeking_Air_Mine": CATEGORIES.TRAP,
  "Skeleton_Trap": CATEGORIES.TRAP,
  "Tornado_Trap": CATEGORIES.TRAP,
  
  "Wall": CATEGORIES.OTHER,
  "Clan_Castle": CATEGORIES.OTHER,
  "Town_Hall": CATEGORIES.OTHER,
  "Builder_Hut": CATEGORIES.OTHER
};

export default function TownHallBuildings({ buildings, setBuildings, saveToLocalStorage }: TownHallBuildingsProps) {
  const [selectedTownHall, setSelectedTownHall] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES.DEFENSE);
  const [buildingsByCategory, setBuildingsByCategory] = useState<Record<string, Building[]>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  
  // Process buildings data on component mount and when TH or category changes
  useEffect(() => {
    const processData = () => {
      // Group buildings by category
      const groupedByCategory: Record<string, Building[]> = {};
      
      // Initialize categories
      Object.values(CATEGORIES).forEach(category => {
        if (category !== CATEGORIES.ALL) {
          groupedByCategory[category] = [];
        }
      });
      
      console.log("Processing buildings data:", buildingsData.length, "items");
      console.log("Processing resources data:", resourcesData.length, "items");
      console.log("BUILDING_CATEGORIES keys:", Object.keys(BUILDING_CATEGORIES));
      
      // Process buildings data
      buildingsData.forEach((building: any) => {
        // Skip invalid entries
        if (!building["web-scraper-start-url"]) return;
        
        // Fix inconsistent data types
        let townHallLevel = building["Town Hall Level Required"];
        // If Town Hall Level is a string (like "1,500"), convert it to number
        if (typeof townHallLevel === 'string' && townHallLevel.includes(',')) {
          townHallLevel = parseInt(townHallLevel.replace(/,/g, ''));
        }
        
        // Special case for Inferno Tower
        if (building["web-scraper-start-url"].includes("Inferno_Tower") || 
            building["web-scraper-start-url"].includes("Inferno Tower")) {
          // Fix data based on the photo
          const level = building.Level;
          
          // Inferno Tower data from the photo
          const infernoData = {
            1: { th: 10, cost: "1,000,000", buildTime: "12h", hitpoints: "1,500", dps: 30, dph: 80 },
            2: { th: 10, cost: "1,200,000", buildTime: "1d", hitpoints: "1,800", dps: 35, dph: 100 },
            3: { th: 10, cost: "2,400,000", buildTime: "2d", hitpoints: "2,100", dps: 40, dph: 120 },
            4: { th: 11, cost: "3,400,000", buildTime: "2d 12h", hitpoints: "2,400", dps: 45, dph: 140 },
            5: { th: 11, cost: "4,200,000", buildTime: "3d", hitpoints: "2,700", dps: 50, dph: 150 },
            6: { th: 12, cost: "6,000,000", buildTime: "5d", hitpoints: "3,000", dps: 55, dph: 160 },
            7: { th: 13, cost: "8,000,000", buildTime: "7d", hitpoints: "3,300", dps: 65, dph: 180 },
            8: { th: 14, cost: "9,500,000", buildTime: "7d 12h", hitpoints: "3,700", dps: 80, dph: 210 },
            9: { th: 15, cost: "10,000,000", buildTime: "7d 18h", hitpoints: "4,000", dps: 100, dph: 230 },
            10: { th: 16, cost: "11,000,000", buildTime: "8d", hitpoints: "4,400", dps: 120, dph: 260 },
            11: { th: 17, cost: "22,000,000", buildTime: "15d 12h", hitpoints: "4,800", dps: 140, dph: 290 }
          };
          
          if (infernoData[level]) {
            const data = infernoData[level];
            townHallLevel = data.th;
            building.Cost = data.cost;
            building["Build Time"] = data.buildTime;
            building.Hitpoints = data.hitpoints;
            building["Damage per Second"] = data.dps;
            building["Damage per Hit"] = data.dph;
          }
        }
        
        if (townHallLevel <= selectedTownHall) {
          // Extract building type from URL
          const url = building["web-scraper-start-url"];
          
          // Extract building name from URL
          let buildingType = "";
          
          // Special cases for buildings with special characters in URL
          if (url.includes("X-Bow")) {
            buildingType = "X_Bow";
          } else if (url.includes("Hidden_Tesla") || url.includes("Hidden Tesla")) {
            buildingType = "Hidden_Tesla";
          } else if (url.includes("Air_Sweeper") || url.includes("Air Sweeper")) {
            buildingType = "Air_Sweeper";
          } else if (url.includes("Inferno_Tower") || url.includes("Inferno Tower")) {
            buildingType = "Inferno_Tower";
          } else {
            // Use regex for other buildings
            const match = url.match(/wiki\/([^\/]+)(?:\/Home_Village)?(?:\?|$)/);
            buildingType = match ? match[1] : "";
            
            // Replace any spaces or special characters with underscores
            buildingType = buildingType.replace(/ /g, '_');
            buildingType = buildingType.replace(/-/g, '_'); // Replace hyphens with underscores
          }
          
          // Special logging for debugging
          console.log(`URL: ${url}, Extracted: ${buildingType}`);
          
          // Special logging for Hidden Tesla
          if (url.includes("Hidden_Tesla") || url.includes("Hidden Tesla")) {
            console.log("Found Hidden Tesla:", building);
            console.log("Is in BUILDING_CATEGORIES:", BUILDING_CATEGORIES.hasOwnProperty(buildingType));
            console.log("Category:", BUILDING_CATEGORIES[buildingType] || "Not found");
          }
          
          // Determine category
          const category = BUILDING_CATEGORIES[buildingType] || CATEGORIES.OTHER;
          
          console.log(`Building: ${buildingType}, Level: ${building.Level}, TH: ${building["Town Hall Level Required"]}, Category: ${category}`);
          
          // Create a clean building object without web-scraper properties
          const cleanBuilding: Building = {
            Level: building.Level,
            "Damage per Second": building["Damage per Second"],
            "Damage per Attack": building["Damage per Attack"],
            "Damage per Shot": building["Damage per Shot"],
            "Push Strength": building["Push Strength"],
            "Storage Capacity": building["Storage Capacity"],
            Hitpoints: building.Hitpoints,
            Cost: building.Cost,
            "Build Time": building["Build Time"],
            "Experience Gained": building["Experience Gained"],
            "Town Hall Level Required": building["Town Hall Level Required"],
            buildingType: buildingType
          };
          
          // Add to category
          if (groupedByCategory[category]) {
            groupedByCategory[category].push(cleanBuilding);
          }
        }
      });
      
      // Process resources data
      resourcesData.forEach((resource: any) => {
        // Skip invalid entries
        if (!resource["web-scraper-start-url"]) return;
        
        const townHallLevel = resource["Town Hall Level Required"];
        
        if (townHallLevel <= selectedTownHall) {
          // Extract resource type from URL
          const url = resource["web-scraper-start-url"];
          
          // Extract resource name from URL
          let resourceType = "";
          
          // Use regex for resources
          const match = url.match(/wiki\/([^\/]+)(?:\/Home_Village)?(?:\?|$)/);
          resourceType = match ? match[1] : "";
          
          // Replace any spaces or special characters with underscores
          resourceType = resourceType.replace(/ /g, '_');
          resourceType = resourceType.replace(/-/g, '_'); // Replace hyphens with underscores
          
          console.log(`URL: ${url}, Extracted Resource: ${resourceType}`);
          
          // Create a clean resource object
          const cleanResource: Building = {
            Level: resource.Level,
            "Storage Capacity": resource["Storage Capacity"],
            Hitpoints: resource.Hitpoints,
            Cost: typeof resource["Build Cost"] === 'number' ? resource["Build Cost"].toString() : resource["Build Cost"],
            "Build Time": resource["Build Time"],
            "Experience Gained": resource["Experience Gained"],
            "Town Hall Level Required": resource["Town Hall Level Required"],
            buildingType: resourceType
          };
          
          // Add to resource category
          if (groupedByCategory[CATEGORIES.RESOURCE]) {
            groupedByCategory[CATEGORIES.RESOURCE].push(cleanResource);
          }
        }
      });
      
      // Log category counts
      Object.keys(groupedByCategory).forEach(category => {
        console.log(`Category ${category}: ${groupedByCategory[category].length} buildings`);
      });
      
      // Sort buildings within each category by building type and level
      Object.keys(groupedByCategory).forEach(category => {
        groupedByCategory[category].sort((a, b) => {
          // First sort by building type
          if (a.buildingType !== b.buildingType) {
            return a.buildingType! < b.buildingType! ? -1 : 1;
          }
          // Then by level
          return a.Level - b.Level;
        });
      });
      
      setBuildingsByCategory(groupedByCategory);
    };

    processData();
  }, [selectedTownHall]);

  // Reset expanded state when town hall or category changes
  useEffect(() => {
    // Reset all buildings to collapsed state
    setExpandedBuildings({});
  }, [selectedTownHall, selectedCategory]);

  // Get buildings that are exactly for the selected TH level
  const getBuildingsForExactTH = (buildings: Building[]): Building[] => {
    return buildings.filter(building => building["Town Hall Level Required"] === selectedTownHall);
  };

  // Group buildings by type
  const groupBuildingsByType = (buildings: Building[]): Record<string, Building[]> => {
    const grouped: Record<string, Building[]> = {};
    
    buildings.forEach(building => {
      const type = building.buildingType || "";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(building);
    });
    
    return grouped;
  };

  // Format time string (e.g., "1d 12h" to "1 hari 12 jam")
  const formatTime = (timeString: string): string => {
    if (!timeString) return "";
    
    const days = timeString.match(/(\d+)d/);
    const hours = timeString.match(/(\d+)h/);
    const minutes = timeString.match(/(\d+)m/);
    
    let formattedTime = "";
    if (days) formattedTime += `${days[1]} hari `;
    if (hours) formattedTime += `${hours[1]} jam `;
    if (minutes) formattedTime += `${minutes[1]} menit`;
    
    return formattedTime.trim() || timeString;
  };

  // Parse build time to minutes
  const parseBuildTime = (timeString: string): number => {
    const days = timeString.match(/(\d+)d/);
    const hours = timeString.match(/(\d+)h/);
    const minutes = timeString.match(/(\d+)m/);
    
    let totalMinutes = 0;
    if (days) totalMinutes += parseInt(days[1]) * 24 * 60;
    if (hours) totalMinutes += parseInt(hours[1]) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1]);
    
    return totalMinutes;
  };

  // Format duration for building queue
  const formatDuration = (totalMinutes: number): string => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    let parts: string[] = [];
    if (days > 0) parts.push(`${days}h`);
    if (hours > 0) parts.push(`${hours}j`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(' ') : '0m';
  };

  // Add building to queue
  const addToQueue = (building: Building) => {
    // Generate a unique ID
    const newId = Date.now();
    
    // Calculate duration in milliseconds
    const durationMinutes = parseBuildTime(building["Build Time"]);
    const durationMs = durationMinutes * 60 * 1000;
    
    // Determine category based on building type
    const buildingType = building.buildingType || "";
    let category: 'defense' | 'resource' | 'army' | 'wall' | 'other' = 'other';
    if (BUILDING_CATEGORIES[buildingType] === CATEGORIES.DEFENSE) {
      category = 'defense';
    } else if (BUILDING_CATEGORIES[buildingType] === CATEGORIES.RESOURCE) {
      category = 'resource';
    } else if (BUILDING_CATEGORIES[buildingType] === CATEGORIES.ARMY) {
      category = 'army';
    } else if (buildingType === 'Wall') {
      category = 'wall';
    }
    
    // Simplify building name
    const displayName = buildingType.replace(/_/g, ' ');
    
    // Create new building object with high priority for resource buildings
    const newBuilding: BuildingType = {
      id: newId,
      name: `${displayName} Level ${building.Level}`,
      baseName: buildingType.replace(/_/g, ' '),
      category: category,
      duration: durationMs,
      durationText: formatDuration(durationMinutes),
      priority: category === 'resource' ? 'high' : 'medium' // Set resource buildings to high priority by default
    };
    
    // Add to buildings state
    const updatedBuildings = [...buildings, newBuilding];
    setBuildings(updatedBuildings);
    saveToLocalStorage(updatedBuildings);
    
    // Show success message
    toast.success(`${displayName} Level ${building.Level} ditambahkan ke antrean`);
  };

  // Toggle expanded state for a building type
  const toggleExpanded = (buildingType: string) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [buildingType]: !prev[buildingType]
    }));
  };

  // Get category color for badge
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case CATEGORIES.DEFENSE:
        return 'bg-red-600/70';
      case CATEGORIES.RESOURCE:
        return 'bg-yellow-600/70';
      case CATEGORIES.ARMY:
        return 'bg-blue-600/70';
      case CATEGORIES.TRAP:
        return 'bg-purple-600/70';
      case CATEGORIES.OTHER:
        return 'bg-gray-600/70';
      default:
        return 'bg-purple-700/50';
    }
  };

  // Filter buildings based on search term
  const filterBuildings = (buildings: Building[]): Building[] => {
    if (!searchTerm) return buildings;
    
    return buildings.filter(building => {
      const buildingType = building.buildingType || "";
      return buildingType.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase());
    });
  };

  return (
    <Card className="bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          Building berdasarkan Town Hall
        </CardTitle>
        
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <Select
            value={selectedTownHall.toString()}
            onValueChange={(value) => setSelectedTownHall(parseInt(value))}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-[#1d1040]/50 border-[#2a1b4a] text-white">
              <SelectValue placeholder="Pilih Town Hall" />
            </SelectTrigger>
            <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
              {Array.from({ length: 17 }, (_, i) => i + 1).map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  Town Hall {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-[#1d1040]/50 border-[#2a1b4a] text-white">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
              {Object.values(CATEGORIES).filter(c => c !== CATEGORIES.ALL).map((category) => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center">
                    <Filter className="w-3 h-3 mr-2" />
                    {category}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-[#1d1040]/50 border-[#2a1b4a] text-white w-full"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="bg-[#1d1040]/50 border-b border-[#2a1b4a] flex w-full overflow-x-auto mb-4">
            {Object.values(CATEGORIES).filter(c => c !== CATEGORIES.ALL).map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-[#2a1b4a] data-[state=active]:text-white text-gray-400"
              >
                {category}
                <Badge className={`ml-2 text-xs ${getCategoryColor(category)}`}>
                  {buildingsByCategory[category]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.values(CATEGORIES).filter(c => c !== CATEGORIES.ALL).map((category) => {
            const categoryBuildings = filterBuildings(buildingsByCategory[category] || []);
            const newBuildings = getBuildingsForExactTH(categoryBuildings);
            const buildingsByType = groupBuildingsByType(categoryBuildings);
            
            return (
              <TabsContent key={category} value={category} className="mt-2">
                <div className="space-y-4">
                  {/* New buildings at this TH level */}
                  {newBuildings.length > 0 && (
                    <div className="mb-4 p-3 border border-amber-500/30 bg-amber-900/10 rounded-md">
                      <h4 className="text-sm font-medium text-amber-300 mb-2">Baru di TH {selectedTownHall}</h4>
                      <div className="flex flex-wrap gap-2">
                        {newBuildings.map((building, idx) => (
                          <div key={idx} className="flex items-center bg-amber-600/30 text-white rounded-md px-2 py-1">
                            <span className="text-xs">{building.buildingType?.replace(/_/g, ' ')} Level {building.Level}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-5 w-5 p-0 ml-1 text-amber-200 hover:text-white hover:bg-amber-700/50"
                              onClick={() => addToQueue(building)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Building list */}
                  {Object.keys(buildingsByType).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(buildingsByType).map(([buildingType, buildings]) => {
                        const isExpanded = expandedBuildings[buildingType] === true; // Default to collapsed
                        const maxLevel = Math.max(...buildings.map(b => b.Level));
                        const displayName = buildingType.replace(/_/g, ' ');
                        
                        return (
                          <div 
                            key={buildingType} 
                            className="border border-[#2a1b4a]/50 rounded-md overflow-hidden bg-[#1d1040]/30"
                          >
                            {/* Building header */}
                            <div 
                              className="flex justify-between items-center p-3 cursor-pointer hover:bg-[#2a1b4a]/30"
                              onClick={() => toggleExpanded(buildingType)}
                            >
                              <div className="flex items-center">
                                <h3 className="text-white font-medium">{displayName}</h3>
                                <Badge className="ml-2 bg-purple-700/50">{`Max Level: ${maxLevel}`}</Badge>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="p-0 h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a1b4a]/50"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                            
                            {/* Building levels */}
                            {isExpanded && (
                              <div className="p-3 pt-0">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-xs uppercase bg-[#1d1040]/70 text-gray-400">
                                      <tr>
                                        <th scope="col" className="px-3 py-2">Level</th>
                                        {buildings[0]?.["Damage per Second"] !== undefined && (
                                          <th scope="col" className="px-3 py-2">Damage/Sec</th>
                                        )}
                                        {buildings[0]?.["Damage per Attack"] !== undefined && (
                                          <th scope="col" className="px-3 py-2">Damage/Attack</th>
                                        )}
                                        {buildings[0]?.["Damage per Shot"] !== undefined && (
                                          <th scope="col" className="px-3 py-2">Damage/Shot</th>
                                        )}
                                        {buildings[0]?.["Push Strength"] !== undefined && (
                                          <th scope="col" className="px-3 py-2">Push Strength</th>
                                        )}
                                        {buildings[0]?.["Storage Capacity"] !== undefined && (
                                          <th scope="col" className="px-3 py-2">Storage Capacity</th>
                                        )}
                                        <th scope="col" className="px-3 py-2">Hitpoints</th>
                                        <th scope="col" className="px-3 py-2">Cost</th>
                                        <th scope="col" className="px-3 py-2">Build Time</th>
                                        <th scope="col" className="px-3 py-2">TH</th>
                                        <th scope="col" className="px-3 py-2">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {buildings.map((building, index) => (
                                        <tr 
                                          key={index} 
                                          className={`border-b border-[#2a1b4a]/30 ${
                                            building["Town Hall Level Required"] === selectedTownHall 
                                              ? 'bg-purple-900/20' 
                                              : 'bg-[#1d1040]/20'
                                          }`}
                                        >
                                          <td className="px-3 py-2 font-medium text-white">
                                            {building.Level}
                                          </td>
                                          {building["Damage per Second"] !== undefined && (
                                            <td className="px-3 py-2">{building["Damage per Second"]}</td>
                                          )}
                                          {building["Damage per Attack"] !== undefined && (
                                            <td className="px-3 py-2">{building["Damage per Attack"]}</td>
                                          )}
                                          {building["Damage per Shot"] !== undefined && (
                                            <td className="px-3 py-2">{building["Damage per Shot"]}</td>
                                          )}
                                          {building["Push Strength"] !== undefined && (
                                            <td className="px-3 py-2">{building["Push Strength"]}</td>
                                          )}
                                          {building["Storage Capacity"] !== undefined && (
                                            <td className="px-3 py-2">{building["Storage Capacity"]}</td>
                                          )}
                                          <td className="px-3 py-2">{building.Hitpoints}</td>
                                          <td className="px-3 py-2">{building.Cost}</td>
                                          <td className="px-3 py-2">{formatTime(building["Build Time"])}</td>
                                          <td className="px-3 py-2">
                                            <Badge className={`${
                                              building["Town Hall Level Required"] === selectedTownHall 
                                                ? 'bg-amber-600/70' 
                                                : 'bg-gray-600/50'
                                            }`}>
                                              {building["Town Hall Level Required"]}
                                            </Badge>
                                          </td>
                                          <td className="px-3 py-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="h-7 px-2 py-1 text-xs bg-[#2a1b4a]/60 border-purple-500/50 text-purple-300 hover:bg-[#2a1b4a] hover:text-purple-200"
                                              onClick={() => addToQueue(building)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" />
                                              Add
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Tidak ada data building untuk kategori dan Town Hall yang dipilih</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
} 