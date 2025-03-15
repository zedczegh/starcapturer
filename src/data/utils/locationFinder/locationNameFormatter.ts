
export function getLocationNameFormatting(result: {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
}): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  // Format the name based on distance and location type
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 50) {
    // Different formatting based on location type
    if (result.type === 'natural' || result.type === 'dark-site') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `Near ${result.name}`;
    }
  } else if (result.distance > 50 && result.distance <= 100) {
    // For more distant locations
    if (result.type === 'natural') {
      formattedName = `${result.name} vicinity`;
    } else if (result.type === 'urban' || result.type === 'suburban') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `${result.name} area`;
    }
  } else if (result.distance > 100) {
    // For very distant locations, be more generic
    if (result.type === 'natural') {
      formattedName = `Remote natural area`;
    } else {
      formattedName = `Remote region`;
    }
  }
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}
