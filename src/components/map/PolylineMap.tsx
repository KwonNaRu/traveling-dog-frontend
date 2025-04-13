"use client";

import { AdvancedMarker, APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

// Google Maps 타입 정의
interface LatLngLiteral {
    lat: number;
    lng: number;
}

// 위치 정보 타입
interface LocationInfo {
    coords?: { lat: number; lng: number };
    name: string;
    region?: string; // 지역 정보 추가 (도시, 국가 등)
}

// 직선 폴리라인 컴포넌트
const StraightPolyline = ({ positions }: { positions: LatLngLiteral[] }) => {
    const map = useMap();
    const mapsLibrary = useMapsLibrary("maps");
    const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!mapsLibrary || !map || !positions.length) return;

        // 기존 폴리라인 제거
        if (polyline) {
            polyline.setMap(null);
        }

        // 새 폴리라인 생성
        const newPolyline = new mapsLibrary.Polyline({
            path: positions,
            geodesic: true,
            strokeColor: "red", // 직선은 빨간색으로 표시
            strokeOpacity: 0.8,
            strokeWeight: 3,
        });

        // 지도에 폴리라인 추가
        newPolyline.setMap(map);
        setPolyline(newPolyline);

        // 컴포넌트 언마운트 시 폴리라인 제거
        return () => {
            if (newPolyline) {
                newPolyline.setMap(null);
            }
        };
    }, [mapsLibrary, map, positions]);

    return null;
};

// 실제 도로 경로 컴포넌트
const RoadDirections = ({ positions }: { positions: LatLngLiteral[] }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [routeInfo, setRouteInfo] = useState<{
        distance: string;
        duration: string;
    } | null>(null);
    const [error, setError] = useState<boolean>(false);

    // 라이브러리 로드
    useEffect(() => {
        if (!routesLibrary || !map) return;

        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(
            new routesLibrary.DirectionsRenderer({
                map,
                suppressMarkers: true, // 마커는 별도로 표시하므로 숨김
                polylineOptions: {
                    strokeColor: "red",
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                },
            })
        );

        return () => {
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
            }
        };
    }, [routesLibrary, map]);

    // 경로 계산 및 표시
    useEffect(() => {
        if (!directionsService || !directionsRenderer || !positions || positions.length < 2) return;

        const origin = positions[0];
        const destination = positions[positions.length - 1];

        // 중간 경유지 설정
        const waypoints = positions.slice(1, -1).map((point) => ({
            location: { lat: point.lat, lng: point.lng },
            stopover: true,
        }));

        directionsService
            .route({
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.BICYCLING, // 자전거 모드 사용
                optimizeWaypoints: false, // 경유지 순서 최적화 여부
            })
            .then((response) => {
                directionsRenderer.setDirections(response);
                setError(false);

                // 경로 정보 저장
                if (response.routes.length > 0) {
                    const route = response.routes[0];
                    let totalDistance = 0;
                    let totalDuration = 0;

                    route.legs.forEach((leg) => {
                        totalDistance += leg.distance?.value || 0;
                        totalDuration += leg.duration?.value || 0;
                    });

                    setRouteInfo({
                        distance: `${(totalDistance / 1000).toFixed(1)} km`,
                        duration: `${Math.floor(totalDuration / 60)} 분`,
                    });
                }
            })
            .catch((error) => {
                console.error("경로 계산 오류:", error);
                setError(true); // 오류 상태 설정

                // 경로 정보 초기화
                setRouteInfo(null);

                // 렌더러 초기화 (이전 경로가 남아있을 수 있음)
                if (directionsRenderer) {
                    directionsRenderer.setMap(null);
                    directionsRenderer.setMap(map);
                }
            });
    }, [directionsService, directionsRenderer, positions]);

    // 경로 정보 표시 (선택 사항)
    return (
        <>
            {/* 오류 발생 시 직선 폴리라인 표시 */}
            {error && <StraightPolyline positions={positions} />}

            {/* 경로 정보 표시 */}
            {(routeInfo || error) && (
                <div
                    className="route-info"
                    style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "10px",
                        backgroundColor: "white",
                        padding: "8px",
                        borderRadius: "4px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        zIndex: 1000,
                    }}
                >
                    {error ? (
                        <div style={{ color: "red" }}>경로를 찾을 수 없습니다. 직선 경로로 표시합니다.</div>
                    ) : (
                        <>
                            <div>총 거리: {routeInfo?.distance}</div>
                            <div>예상 소요 시간: {routeInfo?.duration}</div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

// 위치 정보 처리 내부 컴포넌트
function LocationProcessor({ locations, onPositionsChange }: { locations: string[] | LocationInfo[]; onPositionsChange: (positions: Array<{ lat: number; lng: number; name: string }>) => void }) {
    const map = useMap();
    const placesLibrary = useMapsLibrary("places");

    const [positions, setPositions] = useState<Array<{ lat: number; lng: number; name: string }>>([]);

    // 문자열 배열인지 객체 배열인지 확인
    const isStringArray = locations.length > 0 && typeof locations[0] === "string";

    useEffect(() => {
        if (!placesLibrary || !map) return;

        const processLocations = async () => {
            if (isStringArray) {
                // 문자열 위치 이름 배열 처리
                const stringLocations = locations as string[];
                const results: Array<{ lat: number; lng: number; name: string }> = [];

                for (const name of stringLocations) {
                    try {
                        // 이름과 지역 분리 (형식: "이름, 지역")
                        const parts = name.split(",");
                        const placeName = parts[0].trim();
                        const regionName = parts.length > 1 ? parts[1].trim() : "";

                        const queryString = regionName ? `${placeName} ${regionName}` : placeName;

                        // 새로운 Place API를 사용
                        const { places } = await placesLibrary.Place.searchByText({
                            textQuery: queryString,
                            fields: ["displayName", "location"],
                        });

                        if (places && places.length > 0) {
                            const place = places[0];
                            if (place.location) {
                                results.push({
                                    lat: place.location.lat(),
                                    lng: place.location.lng(),
                                    name: place.displayName || name,
                                });

                                if (results.length === stringLocations.length) {
                                    setPositions(results);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("장소 검색 오류:", error);
                    }
                }
            } else {
                // LocationInfo 객체 배열 처리
                const locInfoArray = locations as LocationInfo[];
                const results: Array<{ lat: number; lng: number; name: string }> = [];

                for (const loc of locInfoArray) {
                    if (loc.coords) {
                        // 이미 좌표가 있는 경우
                        results.push({
                            lat: loc.coords.lat,
                            lng: loc.coords.lng,
                            name: loc.name,
                        });
                    } else {
                        try {
                            // 좌표가 없고 이름만 있는 경우
                            const queryString = loc.region ? `${loc.name} ${loc.region}` : loc.name;

                            // 새로운 Place API를 사용
                            const { places } = await placesLibrary.Place.searchByText({
                                textQuery: queryString,
                                fields: ["displayName", "location"],
                            });

                            if (places && places.length > 0) {
                                const place = places[0];
                                if (place.location) {
                                    results.push({
                                        lat: place.location.lat(),
                                        lng: place.location.lng(),
                                        name: place.displayName || loc.name,
                                    });
                                }
                            }
                        } catch (error) {
                            console.error("장소 검색 오류:", error);
                        }
                    }
                }

                if (results.length > 0) {
                    setPositions(results);
                }
            }
        };

        processLocations();
    }, [placesLibrary, map, locations, isStringArray]);

    useEffect(() => {
        if (positions.length > 0) {
            onPositionsChange(positions);
        }
    }, [positions]);

    return (
        <>
            {positions.map((position, index) => (
                <AdvancedMarker key={index} position={position}>
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                background: "#E91E63",
                                color: "white",
                                padding: "5px 10px",
                                borderRadius: "50%",
                                fontWeight: "bold",
                                zIndex: 2,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {index + 1}
                        </div>
                        <div
                            style={{
                                width: "0",
                                height: "0",
                                borderLeft: "8px solid transparent",
                                borderRight: "8px solid transparent",
                                borderTop: "12px solid #E91E63",
                                marginTop: "-4px",
                                zIndex: 1,
                            }}
                        />
                    </div>
                </AdvancedMarker>
            ))}

            {positions.length > 1 && <RoadDirections positions={positions} />}
        </>
    );
}

// 🧠 중심 이동 전용 서브 컴포넌트
function MapCenterController({ positions }: { positions: Array<{ lat: number; lng: number; name: string }> }) {
    const map = useMap();

    useEffect(() => {
        if (map && positions.length > 0) {
            const center = calculateCenter(positions);
            // const center = positions[0];
            map.panTo(center); // 👈 지도 중심 이동
        }
    }, [positions, map]);

    return null;
}

export default function PolylineMap({ locationNames }: { locationNames: string[] | LocationInfo[] }) {
    const [positions, setPositions] = useState<Array<{ lat: number; lng: number; name: string }>>([]);

    const defaultPosition = calculateCenter(positions);

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
            <Map
                key={JSON.stringify(defaultPosition)} // 👉 여기가 포인트!
                defaultCenter={defaultPosition}
                defaultZoom={9}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
                style={{ width: "100%", height: "100%" }}
            >
                {/* 중심 자동 이동 제어 */}
                {/* <MapCenterController positions={positions} /> */}

                {/* 경로 표시 (직선 또는 도로) */}
                <LocationProcessor locations={locationNames} onPositionsChange={setPositions} />
            </Map>
        </APIProvider>
    );
}

// 중심 좌표 계산 함수
const calculateCenter = (positions: Array<{ lat: number; lng: number; name: string }>): { lat: number; lng: number } => {
    if (positions.length === 0) {
        return { lat: 36.5, lng: 127.8 }; // 기본값: 한국 중심 좌표
    }

    const totalLat = positions.reduce((sum, pos) => sum + pos.lat, 0);
    const totalLng = positions.reduce((sum, pos) => sum + pos.lng, 0);

    return {
        lat: totalLat / positions.length,
        lng: totalLng / positions.length,
    };
};
