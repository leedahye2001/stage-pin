export type MapLocation = { latitude: number; longitude: number };

export function requestCurrentLocation(geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined): Promise<MapLocation> {
  return new Promise((resolve, reject) => {
    if (!geolocation) return reject(new Error('이 브라우저는 위치 조회를 지원하지 않아요.'));
    geolocation.getCurrentPosition(({ coords }) => {
      if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)
        || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
        reject(new Error('위치를 확인하지 못했어요. 다시 시도해 주세요.'));
        return;
      }
      resolve({ latitude: coords.latitude, longitude: coords.longitude });
    }, error => reject(new Error(error.code === 1
      ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 접근을 허용해 주세요.'
      : error.code === 3 ? '위치 조회 시간이 초과됐어요. 다시 시도해 주세요.'
        : '현재 위치를 확인하지 못했어요. 위치 설정을 확인해 주세요.')),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  });
}
