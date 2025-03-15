
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
  
  // Remove unnecessary punctuation and zip codes for cleaner display
  formattedName = formattedName.replace(/，\d{6}$|, \d{5,6}$/, '');
  
  // Extract the most meaningful part of the location name (often the second part for Chinese addresses)
  const parts = formattedName.split(/,|，/);
  if (parts.length >= 2) {
    // For Chinese addresses that are very detailed, use the district/city part
    if (parts.length >= 3 && (formattedName.includes('省') || formattedName.includes('市'))) {
      // Find the city/district part
      const cityPart = parts.find(part => 
        part.trim().includes('区') || 
        part.trim().includes('市') || 
        part.trim().includes('县')
      );
      
      if (cityPart) {
        formattedName = cityPart.trim();
      } else {
        // Use province if no city found
        formattedName = parts[1].trim();
      }
    } else {
      // For English addresses or simpler Chinese addresses, use the second part
      formattedName = parts[1].trim();
    }
  }
  
  // Apply distance-based formatting
  if (result.distance > 15 && result.distance <= 50) {
    // Different formatting based on location type
    if (result.type === 'natural' || result.type === 'dark-site') {
      formattedName = `${formattedName} region`;
    } else if (result.type === 'mountain' || formattedName.includes('Mountain') || 
              formattedName.includes('山') || formattedName.includes('Peak')) {
      formattedName = formattedName; // Keep mountain names as is
    } else {
      formattedName = `Near ${formattedName}`;
    }
  } else if (result.distance > 50 && result.distance <= 100) {
    // For more distant locations
    if (result.type === 'natural') {
      formattedName = `${formattedName} vicinity`;
    } else if (result.type === 'urban' || result.type === 'suburban') {
      formattedName = `${formattedName} region`;
    } else {
      formattedName = `${formattedName} area`;
    }
  } else if (result.distance > 100) {
    // For very distant locations, be more descriptive
    if (result.type === 'natural' || result.type === 'mountain' || 
        formattedName.includes('Mountain') || formattedName.includes('山')) {
      formattedName = `Remote ${formattedName} area`;
    } else if (formattedName.length > 0) {
      formattedName = `${formattedName} region`;
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
