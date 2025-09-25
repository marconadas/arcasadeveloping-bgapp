import { NextRequest, NextResponse } from 'next/server';

// Export dynamic for Next.js static generation
export const dynamic = 'force-dynamic';

// Configuration for GFW proxy
const GFW_PROXY_URL = process.env.NODE_ENV === 'production'
  ? 'https://bgapp-gfw-proxy.majearcasa.workers.dev'
  : 'https://bgapp-admin-api-worker.majearcasa.workers.dev';

const API_WORKER_URL = process.env.NODE_ENV === 'production'
  ? 'https://bgapp-api-worker.majearcasa.workers.dev'
  : 'https://bgapp-admin-api-worker.majearcasa.workers.dev';

export async function GET(_request: NextRequest) {
  try {
    // Try to get real vessel data from GFW via proxy
    const response = await fetch(`${GFW_PROXY_URL}/api/gfw/vessel-presence`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback to API worker
    const fallbackResponse = await fetch(`${API_WORKER_URL}/api/gfw/vessel-presence`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return NextResponse.json(data);
    }

    // If both fail, return enhanced mock data for Angola waters
    const mockVessels = [
      {
        id: 'vessel-1',
        name: 'Luanda Express',
        mmsi: '123456789',
        imo: '9876543',
        callsign: 'LAEX',
        latitude: -8.8137,
        longitude: 13.2894,
        speed: 12.5,
        course: 45,
        heading: 47,
        timestamp: new Date().toISOString(),
        type: 'Cargo',
        flag: 'AO',
        length: 180,
        width: 25,
        draught: 8.5,
        destination: 'LOBITO',
        eta: new Date(Date.now() + 86400000).toISOString(),
        source: 'ais'
      },
      {
        id: 'vessel-2',
        name: 'Benguela Star',
        mmsi: '987654321',
        imo: '1234567',
        callsign: 'BENG',
        latitude: -12.5744,
        longitude: 13.4035,
        speed: 8.2,
        course: 180,
        heading: 182,
        timestamp: new Date().toISOString(),
        type: 'Fishing',
        flag: 'AO',
        length: 45,
        width: 12,
        draught: 4.5,
        destination: 'FISHING AREA',
        eta: null,
        source: 'ais'
      },
      {
        id: 'vessel-3',
        name: 'Atlantic Pioneer',
        mmsi: '456789123',
        imo: '7891234',
        callsign: 'ATPI',
        latitude: -10.5,
        longitude: 13.8,
        speed: 15.3,
        course: 320,
        heading: 318,
        timestamp: new Date().toISOString(),
        type: 'Tanker',
        flag: 'LR',
        length: 250,
        width: 40,
        draught: 12.0,
        destination: 'SOYO TERMINAL',
        eta: new Date(Date.now() + 43200000).toISOString(),
        source: 'ais'
      },
      {
        id: 'vessel-4',
        name: 'Ocean Harvest',
        mmsi: '789123456',
        imo: '4567891',
        callsign: 'OHAR',
        latitude: -11.2,
        longitude: 12.9,
        speed: 6.5,
        course: 90,
        heading: 92,
        timestamp: new Date().toISOString(),
        type: 'Fishing',
        flag: 'AO',
        length: 55,
        width: 14,
        draught: 5.0,
        destination: 'FISHING GROUNDS',
        eta: null,
        source: 'ais'
      },
      {
        id: 'vessel-5',
        name: 'Namibe Trader',
        mmsi: '321654987',
        imo: '7894561',
        callsign: 'NAMT',
        latitude: -15.2,
        longitude: 12.1,
        speed: 10.8,
        course: 15,
        heading: 17,
        timestamp: new Date().toISOString(),
        type: 'Cargo',
        flag: 'PT',
        length: 150,
        width: 22,
        draught: 7.5,
        destination: 'LUANDA',
        eta: new Date(Date.now() + 129600000).toISOString(),
        source: 'ais'
      },
      {
        id: 'vessel-6',
        name: 'Cabinda Pearl',
        mmsi: '654987321',
        imo: '1597534',
        callsign: 'CABP',
        latitude: -5.5,
        longitude: 12.2,
        speed: 11.2,
        course: 225,
        heading: 227,
        timestamp: new Date().toISOString(),
        type: 'Supply',
        flag: 'AO',
        length: 85,
        width: 18,
        draught: 5.5,
        destination: 'OFFSHORE PLATFORM',
        eta: new Date(Date.now() + 21600000).toISOString(),
        source: 'ais'
      },
      {
        id: 'vessel-7',
        name: 'Kwanza Explorer',
        mmsi: '147258369',
        imo: '9517534',
        callsign: 'KWEX',
        latitude: -9.3,
        longitude: 13.1,
        speed: 0.2,
        course: 0,
        heading: 45,
        timestamp: new Date().toISOString(),
        type: 'Research',
        flag: 'AO',
        length: 95,
        width: 16,
        draught: 6.0,
        destination: 'SURVEY AREA',
        eta: null,
        status: 'Engaged in research',
        source: 'ais'
      },
      {
        id: 'vessel-8',
        name: 'Porto Alexandre',
        mmsi: '369258147',
        imo: '7534951',
        callsign: 'POAL',
        latitude: -14.8,
        longitude: 12.3,
        speed: 9.7,
        course: 355,
        heading: 357,
        timestamp: new Date().toISOString(),
        type: 'Container',
        flag: 'AO',
        length: 200,
        width: 30,
        draught: 9.0,
        destination: 'WALVIS BAY',
        eta: new Date(Date.now() + 172800000).toISOString(),
        source: 'ais'
      }
    ];

    return NextResponse.json({
      vessels: mockVessels,
      total: mockVessels.length,
      timestamp: new Date().toISOString(),
      source: 'mock',
      area: {
        north: -4.0,
        south: -18.0,
        east: 24.0,
        west: 11.0
      }
    });
  } catch (error) {
    console.error('Error fetching vessel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vessel data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle vessel filtering and search
  try {
    const body = await request.json();
    const { filters } = body;

    // Forward to worker with filters
    const response = await fetch(`${API_WORKER_URL}/api/gfw/vessel-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters }),
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Failed to search vessels' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error searching vessels:', error);
    return NextResponse.json(
      { error: 'Failed to search vessels' },
      { status: 500 }
    );
  }
}