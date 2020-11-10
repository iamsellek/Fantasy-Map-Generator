/**
 * latitude bands
 *
 * x4 = 0-5 latitude: wet through the year (rising zone)
 * x2 = 5-20 latitude: wet summer (rising zone), dry winter (sinking zone)
 * x1 = 20-30 latitude: dry all year (sinking zone)
 * x2 = 30-50 latitude: wet winter (rising zone), dry summer (sinking zone)
 * x3 = 50-60 latitude: wet all year (rising zone)
 * x2 = 60-70 latitude: wet summer (rising zone), dry winter (sinking zone)
 * x1 = 70-90 latitude: dry all year (sinking zone)
 */
const LATITUDE_MODIFIER = [
  4,
  2,
  2,
  2,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  2,
  2,
  1,
  1,
  1,
  0.5,
]; // by 5d step
