import { flavors } from '@catppuccin/palette';
// Just log the flavor names
console.log(Object.keys(flavors));
// Log the structure of one flavor
console.log(JSON.stringify(flavors.latte.colors, null, 2).substring(0, 1000));
