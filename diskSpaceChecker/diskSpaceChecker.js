const { execSync } = require('child_process');

function getDiskSpaceStatus(path = '/') {
  try {
    const output = execSync(`df -k ${path}`).toString().split('\n')[1].split(/\s+/);

    const total = parseInt(output[1]) * 1024;  
    const used = parseInt(output[2]) * 1024;
    const available = parseInt(output[3]) * 1024;

    const GB = 5 * 1024 * 1024 * 1024;

    return {
      total,
      used,
      available,
      availableGB: (available / (1024 ** 3)).toFixed(2) + ' GB',
      isAvailable: available >= GB 
    };

  } catch (error) {
    return {
      error: 'Unable to fetch disk space',
      isAvailable: false
    };
  }
}

module.exports = { getDiskSpaceStatus };