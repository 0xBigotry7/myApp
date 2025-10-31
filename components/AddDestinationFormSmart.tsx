"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

// Comprehensive city database with coordinates
const CITIES_DATABASE = [
  // Asia - East Asia
  { city: "Tokyo", country: "Japan", code: "JP", lat: 35.6762, lng: 139.6503, flag: "🇯🇵", region: "Asia" },
  { city: "Osaka", country: "Japan", code: "JP", lat: 34.6937, lng: 135.5023, flag: "🇯🇵", region: "Asia" },
  { city: "Kyoto", country: "Japan", code: "JP", lat: 35.0116, lng: 135.7681, flag: "🇯🇵", region: "Asia" },
  { city: "Hiroshima", country: "Japan", code: "JP", lat: 34.3853, lng: 132.4553, flag: "🇯🇵", region: "Asia" },
  { city: "Nara", country: "Japan", code: "JP", lat: 34.6851, lng: 135.8048, flag: "🇯🇵", region: "Asia" },
  { city: "Fukuoka", country: "Japan", code: "JP", lat: 33.5904, lng: 130.4017, flag: "🇯🇵", region: "Asia" },
  { city: "Sapporo", country: "Japan", code: "JP", lat: 43.0642, lng: 141.3469, flag: "🇯🇵", region: "Asia" },
  { city: "Yokohama", country: "Japan", code: "JP", lat: 35.4437, lng: 139.6380, flag: "🇯🇵", region: "Asia" },
  { city: "Kanazawa", country: "Japan", code: "JP", lat: 36.5613, lng: 136.6562, flag: "🇯🇵", region: "Asia" },
  { city: "Nagoya", country: "Japan", code: "JP", lat: 35.1815, lng: 136.9066, flag: "🇯🇵", region: "Asia" },
  { city: "Nikko", country: "Japan", code: "JP", lat: 36.7199, lng: 139.6982, flag: "🇯🇵", region: "Asia" },
  { city: "Hakone", country: "Japan", code: "JP", lat: 35.2329, lng: 139.1067, flag: "🇯🇵", region: "Asia" },
  { city: "Okinawa", country: "Japan", code: "JP", lat: 26.2124, lng: 127.6809, flag: "🇯🇵", region: "Asia" },
  { city: "Seoul", country: "South Korea", code: "KR", lat: 37.5665, lng: 126.9780, flag: "🇰🇷", region: "Asia" },
  { city: "Busan", country: "South Korea", code: "KR", lat: 35.1796, lng: 129.0756, flag: "🇰🇷", region: "Asia" },
  { city: "Jeju", country: "South Korea", code: "KR", lat: 33.4996, lng: 126.5312, flag: "🇰🇷", region: "Asia" },
  { city: "Gyeongju", country: "South Korea", code: "KR", lat: 35.8562, lng: 129.2247, flag: "🇰🇷", region: "Asia" },
  { city: "Incheon", country: "South Korea", code: "KR", lat: 37.4563, lng: 126.7052, flag: "🇰🇷", region: "Asia" },
  { city: "Beijing", country: "China", code: "CN", lat: 39.9042, lng: 116.4074, flag: "🇨🇳", region: "Asia" },
  { city: "Shanghai", country: "China", code: "CN", lat: 31.2304, lng: 121.4737, flag: "🇨🇳", region: "Asia" },
  { city: "Chengdu", country: "China", code: "CN", lat: 30.5728, lng: 104.0668, flag: "🇨🇳", region: "Asia" },
  { city: "Guangzhou", country: "China", code: "CN", lat: 23.1291, lng: 113.2644, flag: "🇨🇳", region: "Asia" },
  { city: "Shenzhen", country: "China", code: "CN", lat: 22.5431, lng: 114.0579, flag: "🇨🇳", region: "Asia" },
  { city: "Chongqing", country: "China", code: "CN", lat: 29.4316, lng: 106.9123, flag: "🇨🇳", region: "Asia" },
  { city: "Xi'an", country: "China", code: "CN", lat: 34.3416, lng: 108.9398, flag: "🇨🇳", region: "Asia" },
  { city: "Hangzhou", country: "China", code: "CN", lat: 30.2741, lng: 120.1551, flag: "🇨🇳", region: "Asia" },
  { city: "Suzhou", country: "China", code: "CN", lat: 31.2989, lng: 120.5853, flag: "🇨🇳", region: "Asia" },
  { city: "Guilin", country: "China", code: "CN", lat: 25.2736, lng: 110.2900, flag: "🇨🇳", region: "Asia" },
  { city: "Lijiang", country: "China", code: "CN", lat: 26.8559, lng: 100.2207, flag: "🇨🇳", region: "Asia" },
  { city: "Kunming", country: "China", code: "CN", lat: 25.0389, lng: 102.7183, flag: "🇨🇳", region: "Asia" },
  { city: "Xiamen", country: "China", code: "CN", lat: 24.4798, lng: 118.0894, flag: "🇨🇳", region: "Asia" },
  { city: "Zhangjiajie", country: "China", code: "CN", lat: 29.1167, lng: 110.4786, flag: "🇨🇳", region: "Asia" },
  { city: "Huangshan", country: "China", code: "CN", lat: 30.1339, lng: 118.1622, flag: "🇨🇳", region: "Asia" },
  { city: "Lhasa", country: "China", code: "CN", lat: 29.6520, lng: 91.1721, flag: "🇨🇳", region: "Asia" },
  { city: "Qingdao", country: "China", code: "CN", lat: 36.0671, lng: 120.3826, flag: "🇨🇳", region: "Asia" },
  { city: "Harbin", country: "China", code: "CN", lat: 45.8038, lng: 126.5340, flag: "🇨🇳", region: "Asia" },
  { city: "Nanjing", country: "China", code: "CN", lat: 32.0603, lng: 118.7969, flag: "🇨🇳", region: "Asia" },
  { city: "Dalian", country: "China", code: "CN", lat: 38.9140, lng: 121.6147, flag: "🇨🇳", region: "Asia" },
  { city: "Dunhuang", country: "China", code: "CN", lat: 40.1424, lng: 94.6619, flag: "🇨🇳", region: "Asia" },
  { city: "Hong Kong", country: "Hong Kong", code: "HK", lat: 22.3193, lng: 114.1694, flag: "🇭🇰", region: "Asia" },
  { city: "Macau", country: "Macau", code: "MO", lat: 22.1987, lng: 113.5439, flag: "🇲🇴", region: "Asia" },
  { city: "Taipei", country: "Taiwan", code: "TW", lat: 25.0330, lng: 121.5654, flag: "🇹🇼", region: "Asia" },
  { city: "Kaohsiung", country: "Taiwan", code: "TW", lat: 22.6273, lng: 120.3014, flag: "🇹🇼", region: "Asia" },
  { city: "Taichung", country: "Taiwan", code: "TW", lat: 24.1477, lng: 120.6736, flag: "🇹🇼", region: "Asia" },
  { city: "Tainan", country: "Taiwan", code: "TW", lat: 22.9997, lng: 120.2270, flag: "🇹🇼", region: "Asia" },
  { city: "Hualien", country: "Taiwan", code: "TW", lat: 23.9871, lng: 121.6015, flag: "🇹🇼", region: "Asia" },
  { city: "Taroko Gorge", country: "Taiwan", code: "TW", lat: 24.1569, lng: 121.4931, flag: "🇹🇼", region: "Asia" },

  // Asia - Southeast Asia
  { city: "Singapore", country: "Singapore", code: "SG", lat: 1.3521, lng: 103.8198, flag: "🇸🇬", region: "Asia" },
  { city: "Bangkok", country: "Thailand", code: "TH", lat: 13.7563, lng: 100.5018, flag: "🇹🇭", region: "Asia" },
  { city: "Phuket", country: "Thailand", code: "TH", lat: 7.8804, lng: 98.3923, flag: "🇹🇭", region: "Asia" },
  { city: "Chiang Mai", country: "Thailand", code: "TH", lat: 18.7883, lng: 98.9853, flag: "🇹🇭", region: "Asia" },
  { city: "Pattaya", country: "Thailand", code: "TH", lat: 12.9236, lng: 100.8825, flag: "🇹🇭", region: "Asia" },
  { city: "Krabi", country: "Thailand", code: "TH", lat: 8.0863, lng: 98.9063, flag: "🇹🇭", region: "Asia" },
  { city: "Ayutthaya", country: "Thailand", code: "TH", lat: 14.3532, lng: 100.5773, flag: "🇹🇭", region: "Asia" },
  { city: "Kuala Lumpur", country: "Malaysia", code: "MY", lat: 3.1390, lng: 101.6869, flag: "🇲🇾", region: "Asia" },
  { city: "Penang", country: "Malaysia", code: "MY", lat: 5.4164, lng: 100.3327, flag: "🇲🇾", region: "Asia" },
  { city: "Langkawi", country: "Malaysia", code: "MY", lat: 6.3500, lng: 99.8000, flag: "🇲🇾", region: "Asia" },
  { city: "Malacca", country: "Malaysia", code: "MY", lat: 2.1896, lng: 102.2501, flag: "🇲🇾", region: "Asia" },
  { city: "Bali", country: "Indonesia", code: "ID", lat: -8.3405, lng: 115.0920, flag: "🇮🇩", region: "Asia" },
  { city: "Jakarta", country: "Indonesia", code: "ID", lat: -6.2088, lng: 106.8456, flag: "🇮🇩", region: "Asia" },
  { city: "Yogyakarta", country: "Indonesia", code: "ID", lat: -7.7956, lng: 110.3695, flag: "🇮🇩", region: "Asia" },
  { city: "Lombok", country: "Indonesia", code: "ID", lat: -8.6500, lng: 116.3242, flag: "🇮🇩", region: "Asia" },
  { city: "Manila", country: "Philippines", code: "PH", lat: 14.5995, lng: 120.9842, flag: "🇵🇭", region: "Asia" },
  { city: "Boracay", country: "Philippines", code: "PH", lat: 11.9674, lng: 121.9248, flag: "🇵🇭", region: "Asia" },
  { city: "Cebu", country: "Philippines", code: "PH", lat: 10.3157, lng: 123.8854, flag: "🇵🇭", region: "Asia" },
  { city: "Palawan", country: "Philippines", code: "PH", lat: 9.8349, lng: 118.7384, flag: "🇵🇭", region: "Asia" },
  { city: "Hanoi", country: "Vietnam", code: "VN", lat: 21.0285, lng: 105.8542, flag: "🇻🇳", region: "Asia" },
  { city: "Ho Chi Minh City", country: "Vietnam", code: "VN", lat: 10.8231, lng: 106.6297, flag: "🇻🇳", region: "Asia" },
  { city: "Da Nang", country: "Vietnam", code: "VN", lat: 16.0544, lng: 108.2022, flag: "🇻🇳", region: "Asia" },
  { city: "Hoi An", country: "Vietnam", code: "VN", lat: 15.8801, lng: 108.3380, flag: "🇻🇳", region: "Asia" },
  { city: "Hue", country: "Vietnam", code: "VN", lat: 16.4637, lng: 107.5909, flag: "🇻🇳", region: "Asia" },
  { city: "Ha Long Bay", country: "Vietnam", code: "VN", lat: 20.9101, lng: 107.1839, flag: "🇻🇳", region: "Asia" },
  { city: "Nha Trang", country: "Vietnam", code: "VN", lat: 12.2388, lng: 109.1967, flag: "🇻🇳", region: "Asia" },
  { city: "Siem Reap", country: "Cambodia", code: "KH", lat: 13.3671, lng: 103.8448, flag: "🇰🇭", region: "Asia" },
  { city: "Phnom Penh", country: "Cambodia", code: "KH", lat: 11.5564, lng: 104.9282, flag: "🇰🇭", region: "Asia" },
  { city: "Luang Prabang", country: "Laos", code: "LA", lat: 19.8845, lng: 102.1348, flag: "🇱🇦", region: "Asia" },
  { city: "Vientiane", country: "Laos", code: "LA", lat: 17.9757, lng: 102.6331, flag: "🇱🇦", region: "Asia" },
  { city: "Yangon", country: "Myanmar", code: "MM", lat: 16.8661, lng: 96.1951, flag: "🇲🇲", region: "Asia" },
  { city: "Bagan", country: "Myanmar", code: "MM", lat: 21.1717, lng: 94.8579, flag: "🇲🇲", region: "Asia" },
  { city: "Bandar Seri Begawan", country: "Brunei", code: "BN", lat: 4.9031, lng: 114.9398, flag: "🇧🇳", region: "Asia" },

  // Asia - Middle East
  { city: "Dubai", country: "UAE", code: "AE", lat: 25.2048, lng: 55.2708, flag: "🇦🇪", region: "Asia" },
  { city: "Abu Dhabi", country: "UAE", code: "AE", lat: 24.4539, lng: 54.3773, flag: "🇦🇪", region: "Asia" },
  { city: "Doha", country: "Qatar", code: "QA", lat: 25.2854, lng: 51.5310, flag: "🇶🇦", region: "Asia" },
  { city: "Jerusalem", country: "Israel", code: "IL", lat: 31.7683, lng: 35.2137, flag: "🇮🇱", region: "Asia" },
  { city: "Tel Aviv", country: "Israel", code: "IL", lat: 32.0853, lng: 34.7818, flag: "🇮🇱", region: "Asia" },
  { city: "Amman", country: "Jordan", code: "JO", lat: 31.9454, lng: 35.9284, flag: "🇯🇴", region: "Asia" },
  { city: "Petra", country: "Jordan", code: "JO", lat: 30.3285, lng: 35.4444, flag: "🇯🇴", region: "Asia" },

  // Asia - South Asia
  { city: "Mumbai", country: "India", code: "IN", lat: 19.0760, lng: 72.8777, flag: "🇮🇳", region: "Asia" },
  { city: "Delhi", country: "India", code: "IN", lat: 28.7041, lng: 77.1025, flag: "🇮🇳", region: "Asia" },
  { city: "Bangalore", country: "India", code: "IN", lat: 12.9716, lng: 77.5946, flag: "🇮🇳", region: "Asia" },
  { city: "Jaipur", country: "India", code: "IN", lat: 26.9124, lng: 75.7873, flag: "🇮🇳", region: "Asia" },
  { city: "Goa", country: "India", code: "IN", lat: 15.2993, lng: 74.1240, flag: "🇮🇳", region: "Asia" },
  { city: "Agra", country: "India", code: "IN", lat: 27.1767, lng: 78.0081, flag: "🇮🇳", region: "Asia" },
  { city: "Kathmandu", country: "Nepal", code: "NP", lat: 27.7172, lng: 85.3240, flag: "🇳🇵", region: "Asia" },
  { city: "Colombo", country: "Sri Lanka", code: "LK", lat: 6.9271, lng: 79.8612, flag: "🇱🇰", region: "Asia" },
  { city: "Maldives", country: "Maldives", code: "MV", lat: 3.2028, lng: 73.2207, flag: "🇲🇻", region: "Asia" },

  // Europe - Western Europe
  { city: "London", country: "UK", code: "GB", lat: 51.5074, lng: -0.1278, flag: "🇬🇧", region: "Europe" },
  { city: "Edinburgh", country: "UK", code: "GB", lat: 55.9533, lng: -3.1883, flag: "🇬🇧", region: "Europe" },
  { city: "Dublin", country: "Ireland", code: "IE", lat: 53.3498, lng: -6.2603, flag: "🇮🇪", region: "Europe" },
  { city: "Paris", country: "France", code: "FR", lat: 48.8566, lng: 2.3522, flag: "🇫🇷", region: "Europe" },
  { city: "Nice", country: "France", code: "FR", lat: 43.7102, lng: 7.2620, flag: "🇫🇷", region: "Europe" },
  { city: "Lyon", country: "France", code: "FR", lat: 45.7640, lng: 4.8357, flag: "🇫🇷", region: "Europe" },
  { city: "Amsterdam", country: "Netherlands", code: "NL", lat: 52.3676, lng: 4.9041, flag: "🇳🇱", region: "Europe" },
  { city: "Brussels", country: "Belgium", code: "BE", lat: 50.8503, lng: 4.3517, flag: "🇧🇪", region: "Europe" },
  { city: "Bruges", country: "Belgium", code: "BE", lat: 51.2093, lng: 3.2247, flag: "🇧🇪", region: "Europe" },
  { city: "Luxembourg", country: "Luxembourg", code: "LU", lat: 49.6116, lng: 6.1319, flag: "🇱🇺", region: "Europe" },

  // Europe - Central Europe
  { city: "Berlin", country: "Germany", code: "DE", lat: 52.5200, lng: 13.4050, flag: "🇩🇪", region: "Europe" },
  { city: "Munich", country: "Germany", code: "DE", lat: 48.1351, lng: 11.5820, flag: "🇩🇪", region: "Europe" },
  { city: "Frankfurt", country: "Germany", code: "DE", lat: 50.1109, lng: 8.6821, flag: "🇩🇪", region: "Europe" },
  { city: "Vienna", country: "Austria", code: "AT", lat: 48.2082, lng: 16.3738, flag: "🇦🇹", region: "Europe" },
  { city: "Salzburg", country: "Austria", code: "AT", lat: 47.8095, lng: 13.0550, flag: "🇦🇹", region: "Europe" },
  { city: "Prague", country: "Czech Republic", code: "CZ", lat: 50.0755, lng: 14.4378, flag: "🇨🇿", region: "Europe" },
  { city: "Budapest", country: "Hungary", code: "HU", lat: 47.4979, lng: 19.0402, flag: "🇭🇺", region: "Europe" },
  { city: "Krakow", country: "Poland", code: "PL", lat: 50.0647, lng: 19.9450, flag: "🇵🇱", region: "Europe" },
  { city: "Warsaw", country: "Poland", code: "PL", lat: 52.2297, lng: 21.0122, flag: "🇵🇱", region: "Europe" },
  { city: "Zurich", country: "Switzerland", code: "CH", lat: 47.3769, lng: 8.5417, flag: "🇨🇭", region: "Europe" },
  { city: "Geneva", country: "Switzerland", code: "CH", lat: 46.2044, lng: 6.1432, flag: "🇨🇭", region: "Europe" },
  { city: "Interlaken", country: "Switzerland", code: "CH", lat: 46.6863, lng: 7.8632, flag: "🇨🇭", region: "Europe" },

  // Europe - Southern Europe
  { city: "Rome", country: "Italy", code: "IT", lat: 41.9028, lng: 12.4964, flag: "🇮🇹", region: "Europe" },
  { city: "Venice", country: "Italy", code: "IT", lat: 45.4408, lng: 12.3155, flag: "🇮🇹", region: "Europe" },
  { city: "Florence", country: "Italy", code: "IT", lat: 43.7696, lng: 11.2558, flag: "🇮🇹", region: "Europe" },
  { city: "Milan", country: "Italy", code: "IT", lat: 45.4642, lng: 9.1900, flag: "🇮🇹", region: "Europe" },
  { city: "Naples", country: "Italy", code: "IT", lat: 40.8518, lng: 14.2681, flag: "🇮🇹", region: "Europe" },
  { city: "Amalfi Coast", country: "Italy", code: "IT", lat: 40.6333, lng: 14.6027, flag: "🇮🇹", region: "Europe" },
  { city: "Barcelona", country: "Spain", code: "ES", lat: 41.3851, lng: 2.1734, flag: "🇪🇸", region: "Europe" },
  { city: "Madrid", country: "Spain", code: "ES", lat: 40.4168, lng: -3.7038, flag: "🇪🇸", region: "Europe" },
  { city: "Seville", country: "Spain", code: "ES", lat: 37.3891, lng: -5.9845, flag: "🇪🇸", region: "Europe" },
  { city: "Granada", country: "Spain", code: "ES", lat: 37.1773, lng: -3.5986, flag: "🇪🇸", region: "Europe" },
  { city: "Valencia", country: "Spain", code: "ES", lat: 39.4699, lng: -0.3763, flag: "🇪🇸", region: "Europe" },
  { city: "Ibiza", country: "Spain", code: "ES", lat: 38.9067, lng: 1.4206, flag: "🇪🇸", region: "Europe" },
  { city: "Lisbon", country: "Portugal", code: "PT", lat: 38.7223, lng: -9.1393, flag: "🇵🇹", region: "Europe" },
  { city: "Porto", country: "Portugal", code: "PT", lat: 41.1579, lng: -8.6291, flag: "🇵🇹", region: "Europe" },
  { city: "Algarve", country: "Portugal", code: "PT", lat: 37.0179, lng: -7.9304, flag: "🇵🇹", region: "Europe" },
  { city: "Athens", country: "Greece", code: "GR", lat: 37.9838, lng: 23.7275, flag: "🇬🇷", region: "Europe" },
  { city: "Santorini", country: "Greece", code: "GR", lat: 36.3932, lng: 25.4615, flag: "🇬🇷", region: "Europe" },
  { city: "Mykonos", country: "Greece", code: "GR", lat: 37.4467, lng: 25.3289, flag: "🇬🇷", region: "Europe" },
  { city: "Crete", country: "Greece", code: "GR", lat: 35.2401, lng: 24.8093, flag: "🇬🇷", region: "Europe" },
  { city: "Dubrovnik", country: "Croatia", code: "HR", lat: 42.6507, lng: 18.0944, flag: "🇭🇷", region: "Europe" },
  { city: "Split", country: "Croatia", code: "HR", lat: 43.5081, lng: 16.4402, flag: "🇭🇷", region: "Europe" },
  { city: "Valletta", country: "Malta", code: "MT", lat: 35.8989, lng: 14.5146, flag: "🇲🇹", region: "Europe" },

  // Europe - Northern Europe
  { city: "Copenhagen", country: "Denmark", code: "DK", lat: 55.6761, lng: 12.5683, flag: "🇩🇰", region: "Europe" },
  { city: "Stockholm", country: "Sweden", code: "SE", lat: 59.3293, lng: 18.0686, flag: "🇸🇪", region: "Europe" },
  { city: "Oslo", country: "Norway", code: "NO", lat: 59.9139, lng: 10.7522, flag: "🇳🇴", region: "Europe" },
  { city: "Bergen", country: "Norway", code: "NO", lat: 60.3913, lng: 5.3221, flag: "🇳🇴", region: "Europe" },
  { city: "Helsinki", country: "Finland", code: "FI", lat: 60.1695, lng: 24.9354, flag: "🇫🇮", region: "Europe" },
  { city: "Reykjavik", country: "Iceland", code: "IS", lat: 64.1466, lng: -21.9426, flag: "🇮🇸", region: "Europe" },

  // Europe - Eastern Europe & Balkans
  { city: "Moscow", country: "Russia", code: "RU", lat: 55.7558, lng: 37.6173, flag: "🇷🇺", region: "Europe" },
  { city: "St. Petersburg", country: "Russia", code: "RU", lat: 59.9343, lng: 30.3351, flag: "🇷🇺", region: "Europe" },
  { city: "Istanbul", country: "Turkey", code: "TR", lat: 41.0082, lng: 28.9784, flag: "🇹🇷", region: "Europe" },
  { city: "Cappadocia", country: "Turkey", code: "TR", lat: 38.6431, lng: 34.8289, flag: "🇹🇷", region: "Europe" },
  { city: "Bucharest", country: "Romania", code: "RO", lat: 44.4268, lng: 26.1025, flag: "🇷🇴", region: "Europe" },
  { city: "Belgrade", country: "Serbia", code: "RS", lat: 44.7866, lng: 20.4489, flag: "🇷🇸", region: "Europe" },

  // North America - USA
  { city: "New York", country: "USA", code: "US", lat: 40.7128, lng: -74.0060, flag: "🇺🇸", region: "North America" },
  { city: "Los Angeles", country: "USA", code: "US", lat: 34.0522, lng: -118.2437, flag: "🇺🇸", region: "North America" },
  { city: "San Francisco", country: "USA", code: "US", lat: 37.7749, lng: -122.4194, flag: "🇺🇸", region: "North America" },
  { city: "Chicago", country: "USA", code: "US", lat: 41.8781, lng: -87.6298, flag: "🇺🇸", region: "North America" },
  { city: "Las Vegas", country: "USA", code: "US", lat: 36.1699, lng: -115.1398, flag: "🇺🇸", region: "North America" },
  { city: "Miami", country: "USA", code: "US", lat: 25.7617, lng: -80.1918, flag: "🇺🇸", region: "North America" },
  { city: "Orlando", country: "USA", code: "US", lat: 28.5383, lng: -81.3792, flag: "🇺🇸", region: "North America" },
  { city: "Boston", country: "USA", code: "US", lat: 42.3601, lng: -71.0589, flag: "🇺🇸", region: "North America" },
  { city: "Seattle", country: "USA", code: "US", lat: 47.6062, lng: -122.3321, flag: "🇺🇸", region: "North America" },
  { city: "Washington DC", country: "USA", code: "US", lat: 38.9072, lng: -77.0369, flag: "🇺🇸", region: "North America" },
  { city: "New Orleans", country: "USA", code: "US", lat: 29.9511, lng: -90.0715, flag: "🇺🇸", region: "North America" },
  { city: "Austin", country: "USA", code: "US", lat: 30.2672, lng: -97.7431, flag: "🇺🇸", region: "North America" },
  { city: "Nashville", country: "USA", code: "US", lat: 36.1627, lng: -86.7816, flag: "🇺🇸", region: "North America" },
  { city: "Denver", country: "USA", code: "US", lat: 39.7392, lng: -104.9903, flag: "🇺🇸", region: "North America" },
  { city: "San Diego", country: "USA", code: "US", lat: 32.7157, lng: -117.1611, flag: "🇺🇸", region: "North America" },
  { city: "Portland", country: "USA", code: "US", lat: 45.5152, lng: -122.6784, flag: "🇺🇸", region: "North America" },
  { city: "Philadelphia", country: "USA", code: "US", lat: 39.9526, lng: -75.1652, flag: "🇺🇸", region: "North America" },
  { city: "Phoenix", country: "USA", code: "US", lat: 33.4484, lng: -112.0740, flag: "🇺🇸", region: "North America" },
  { city: "Honolulu", country: "USA", code: "US", lat: 21.3099, lng: -157.8581, flag: "🇺🇸", region: "North America" },
  { city: "Maui", country: "USA", code: "US", lat: 20.7984, lng: -156.3319, flag: "🇺🇸", region: "North America" },
  { city: "Anchorage", country: "USA", code: "US", lat: 61.2181, lng: -149.9003, flag: "🇺🇸", region: "North America" },
  { city: "Santa Barbara", country: "USA", code: "US", lat: 34.4208, lng: -119.6982, flag: "🇺🇸", region: "North America" },
  { city: "Cape Cod", country: "USA", code: "US", lat: 41.6688, lng: -70.2962, flag: "🇺🇸", region: "North America" },
  { city: "Provincetown", country: "USA", code: "US", lat: 42.0526, lng: -70.1826, flag: "🇺🇸", region: "North America" },
  { city: "Detroit", country: "USA", code: "US", lat: 42.3314, lng: -83.0458, flag: "🇺🇸", region: "North America" },
  { city: "Pittsburgh", country: "USA", code: "US", lat: 40.4406, lng: -79.9959, flag: "🇺🇸", region: "North America" },
  { city: "Ithaca", country: "USA", code: "US", lat: 42.4430, lng: -76.5019, flag: "🇺🇸", region: "North America" },
  { city: "Page", country: "USA", code: "US", lat: 36.9147, lng: -111.4558, flag: "🇺🇸", region: "North America" },
  { city: "Moab", country: "USA", code: "US", lat: 38.5733, lng: -109.5498, flag: "🇺🇸", region: "North America" },

  // National Parks
  { city: "Yellowstone National Park", country: "USA", code: "US", lat: 44.4280, lng: -110.5885, flag: "🇺🇸", region: "North America" },
  { city: "Grand Canyon National Park", country: "USA", code: "US", lat: 36.1069, lng: -112.1129, flag: "🇺🇸", region: "North America" },
  { city: "Yosemite National Park", country: "USA", code: "US", lat: 37.8651, lng: -119.5383, flag: "🇺🇸", region: "North America" },
  { city: "Zion National Park", country: "USA", code: "US", lat: 37.2982, lng: -113.0263, flag: "🇺🇸", region: "North America" },
  { city: "Arches National Park", country: "USA", code: "US", lat: 38.7331, lng: -109.5925, flag: "🇺🇸", region: "North America" },
  { city: "Grand Teton National Park", country: "USA", code: "US", lat: 43.7904, lng: -110.6818, flag: "🇺🇸", region: "North America" },
  { city: "Rocky Mountain National Park", country: "USA", code: "US", lat: 40.3428, lng: -105.6836, flag: "🇺🇸", region: "North America" },
  { city: "Glacier National Park", country: "USA", code: "US", lat: 48.7596, lng: -113.7870, flag: "🇺🇸", region: "North America" },
  { city: "Acadia National Park", country: "USA", code: "US", lat: 44.3386, lng: -68.2733, flag: "🇺🇸", region: "North America" },
  { city: "Olympic National Park", country: "USA", code: "US", lat: 47.8021, lng: -123.6044, flag: "🇺🇸", region: "North America" },
  { city: "Bryce Canyon National Park", country: "USA", code: "US", lat: 37.5930, lng: -112.1871, flag: "🇺🇸", region: "North America" },
  { city: "Canyonlands National Park", country: "USA", code: "US", lat: 38.2135, lng: -109.8793, flag: "🇺🇸", region: "North America" },
  { city: "Joshua Tree National Park", country: "USA", code: "US", lat: 33.8734, lng: -115.9010, flag: "🇺🇸", region: "North America" },
  { city: "Death Valley National Park", country: "USA", code: "US", lat: 36.5323, lng: -116.9325, flag: "🇺🇸", region: "North America" },
  { city: "Sequoia National Park", country: "USA", code: "US", lat: 36.4864, lng: -118.5658, flag: "🇺🇸", region: "North America" },
  { city: "Kings Canyon National Park", country: "USA", code: "US", lat: 36.8879, lng: -118.5551, flag: "🇺🇸", region: "North America" },
  { city: "Big Bend National Park", country: "USA", code: "US", lat: 29.1275, lng: -103.2425, flag: "🇺🇸", region: "North America" },
  { city: "Shenandoah National Park", country: "USA", code: "US", lat: 38.2928, lng: -78.6795, flag: "🇺🇸", region: "North America" },
  { city: "Great Smoky Mountains National Park", country: "USA", code: "US", lat: 35.6532, lng: -83.5070, flag: "🇺🇸", region: "North America" },
  { city: "Everglades National Park", country: "USA", code: "US", lat: 25.2866, lng: -80.8987, flag: "🇺🇸", region: "North America" },
  { city: "Mammoth Cave National Park", country: "USA", code: "US", lat: 37.1862, lng: -86.1000, flag: "🇺🇸", region: "North America" },
  { city: "Hot Springs National Park", country: "USA", code: "US", lat: 34.5217, lng: -93.0424, flag: "🇺🇸", region: "North America" },
  { city: "Carlsbad Caverns National Park", country: "USA", code: "US", lat: 32.1479, lng: -104.5567, flag: "🇺🇸", region: "North America" },
  { city: "Badlands National Park", country: "USA", code: "US", lat: 43.8554, lng: -102.3397, flag: "🇺🇸", region: "North America" },
  { city: "Theodore Roosevelt National Park", country: "USA", code: "US", lat: 46.9790, lng: -103.5387, flag: "🇺🇸", region: "North America" },
  { city: "Wind Cave National Park", country: "USA", code: "US", lat: 43.5709, lng: -103.4394, flag: "🇺🇸", region: "North America" },
  { city: "Mesa Verde National Park", country: "USA", code: "US", lat: 37.2309, lng: -108.4618, flag: "🇺🇸", region: "North America" },
  { city: "Petrified Forest National Park", country: "USA", code: "US", lat: 34.9099, lng: -109.8067, flag: "🇺🇸", region: "North America" },
  { city: "Redwood National Park", country: "USA", code: "US", lat: 41.2132, lng: -124.0046, flag: "🇺🇸", region: "North America" },
  { city: "Crater Lake National Park", country: "USA", code: "US", lat: 42.8684, lng: -122.1685, flag: "🇺🇸", region: "North America" },
  { city: "Mount Rainier National Park", country: "USA", code: "US", lat: 46.8800, lng: -121.7269, flag: "🇺🇸", region: "North America" },
  { city: "North Cascades National Park", country: "USA", code: "US", lat: 48.7718, lng: -121.2985, flag: "🇺🇸", region: "North America" },
  { city: "Lassen Volcanic National Park", country: "USA", code: "US", lat: 40.4977, lng: -121.4207, flag: "🇺🇸", region: "North America" },
  { city: "Channel Islands National Park", country: "USA", code: "US", lat: 34.0094, lng: -119.7731, flag: "🇺🇸", region: "North America" },
  { city: "Pinnacles National Park", country: "USA", code: "US", lat: 36.4906, lng: -121.1825, flag: "🇺🇸", region: "North America" },
  { city: "Denali National Park", country: "USA", code: "US", lat: 63.1148, lng: -151.1926, flag: "🇺🇸", region: "North America" },
  { city: "Kenai Fjords National Park", country: "USA", code: "US", lat: 59.8791, lng: -150.1064, flag: "🇺🇸", region: "North America" },
  { city: "Wrangell-St. Elias National Park", country: "USA", code: "US", lat: 61.7104, lng: -142.9857, flag: "🇺🇸", region: "North America" },
  { city: "Katmai National Park", country: "USA", code: "US", lat: 58.5978, lng: -155.0633, flag: "🇺🇸", region: "North America" },
  { city: "Lake Clark National Park", country: "USA", code: "US", lat: 60.4127, lng: -154.3263, flag: "🇺🇸", region: "North America" },
  { city: "Gates of the Arctic National Park", country: "USA", code: "US", lat: 67.7820, lng: -153.2940, flag: "🇺🇸", region: "North America" },
  { city: "Kobuk Valley National Park", country: "USA", code: "US", lat: 67.3500, lng: -159.1000, flag: "🇺🇸", region: "North America" },
  { city: "Haleakalā National Park", country: "USA", code: "US", lat: 20.7204, lng: -156.1552, flag: "🇺🇸", region: "North America" },
  { city: "Hawaiʻi Volcanoes National Park", country: "USA", code: "US", lat: 19.4194, lng: -155.2885, flag: "🇺🇸", region: "North America" },
  { city: "Capitol Reef National Park", country: "USA", code: "US", lat: 38.2821, lng: -111.2479, flag: "🇺🇸", region: "North America" },
  { city: "Great Basin National Park", country: "USA", code: "US", lat: 38.9833, lng: -114.3000, flag: "🇺🇸", region: "North America" },
  { city: "Black Canyon of the Gunnison National Park", country: "USA", code: "US", lat: 38.5754, lng: -107.7416, flag: "🇺🇸", region: "North America" },
  { city: "Guadalupe Mountains National Park", country: "USA", code: "US", lat: 31.8900, lng: -104.8607, flag: "🇺🇸", region: "North America" },
  { city: "Congaree National Park", country: "USA", code: "US", lat: 33.7948, lng: -80.7821, flag: "🇺🇸", region: "North America" },
  { city: "Cuyahoga Valley National Park", country: "USA", code: "US", lat: 41.2808, lng: -81.5678, flag: "🇺🇸", region: "North America" },
  { city: "Dry Tortugas National Park", country: "USA", code: "US", lat: 24.6285, lng: -82.8732, flag: "🇺🇸", region: "North America" },
  { city: "Biscayne National Park", country: "USA", code: "US", lat: 25.4823, lng: -80.2081, flag: "🇺🇸", region: "North America" },
  { city: "Voyageurs National Park", country: "USA", code: "US", lat: 48.4839, lng: -92.8382, flag: "🇺🇸", region: "North America" },
  { city: "Isle Royale National Park", country: "USA", code: "US", lat: 47.9959, lng: -88.9092, flag: "🇺🇸", region: "North America" },
  { city: "Indiana Dunes National Park", country: "USA", code: "US", lat: 41.6533, lng: -87.0524, flag: "🇺🇸", region: "North America" },
  { city: "Gateway Arch National Park", country: "USA", code: "US", lat: 38.6247, lng: -90.1848, flag: "🇺🇸", region: "North America" },
  { city: "New River Gorge National Park", country: "USA", code: "US", lat: 37.9756, lng: -81.0623, flag: "🇺🇸", region: "North America" },
  { city: "Virgin Islands National Park", country: "USA", code: "US", lat: 18.3433, lng: -64.7491, flag: "🇺🇸", region: "North America" },
  { city: "American Samoa National Park", country: "USA", code: "US", lat: -14.2583, lng: -170.6835, flag: "🇺🇸", region: "North America" },

  // North America - Canada
  { city: "Toronto", country: "Canada", code: "CA", lat: 43.6532, lng: -79.3832, flag: "🇨🇦", region: "North America" },
  { city: "Vancouver", country: "Canada", code: "CA", lat: 49.2827, lng: -123.1207, flag: "🇨🇦", region: "North America" },
  { city: "Montreal", country: "Canada", code: "CA", lat: 45.5017, lng: -73.5673, flag: "🇨🇦", region: "North America" },
  { city: "Quebec City", country: "Canada", code: "CA", lat: 46.8139, lng: -71.2080, flag: "🇨🇦", region: "North America" },
  { city: "Calgary", country: "Canada", code: "CA", lat: 51.0447, lng: -114.0719, flag: "🇨🇦", region: "North America" },
  { city: "Banff", country: "Canada", code: "CA", lat: 51.1784, lng: -115.5708, flag: "🇨🇦", region: "North America" },
  { city: "Niagara Falls", country: "Canada", code: "CA", lat: 43.0896, lng: -79.0849, flag: "🇨🇦", region: "North America" },

  // North America - Mexico
  { city: "Mexico City", country: "Mexico", code: "MX", lat: 19.4326, lng: -99.1332, flag: "🇲🇽", region: "North America" },
  { city: "Cancun", country: "Mexico", code: "MX", lat: 21.1619, lng: -86.8515, flag: "🇲🇽", region: "North America" },
  { city: "Playa del Carmen", country: "Mexico", code: "MX", lat: 20.6296, lng: -87.0739, flag: "🇲🇽", region: "North America" },
  { city: "Tulum", country: "Mexico", code: "MX", lat: 20.2114, lng: -87.4654, flag: "🇲🇽", region: "North America" },
  { city: "Cabo San Lucas", country: "Mexico", code: "MX", lat: 22.8905, lng: -109.9167, flag: "🇲🇽", region: "North America" },
  { city: "Puerto Vallarta", country: "Mexico", code: "MX", lat: 20.6534, lng: -105.2253, flag: "🇲🇽", region: "North America" },
  { city: "Guadalajara", country: "Mexico", code: "MX", lat: 20.6597, lng: -103.3496, flag: "🇲🇽", region: "North America" },
  { city: "Oaxaca", country: "Mexico", code: "MX", lat: 17.0732, lng: -96.7266, flag: "🇲🇽", region: "North America" },

  // Caribbean
  { city: "San Juan", country: "Puerto Rico", code: "PR", lat: 18.4655, lng: -66.1057, flag: "🇵🇷", region: "Caribbean" },
  { city: "Nassau", country: "Bahamas", code: "BS", lat: 25.0443, lng: -77.3504, flag: "🇧🇸", region: "Caribbean" },
  { city: "Havana", country: "Cuba", code: "CU", lat: 23.1136, lng: -82.3666, flag: "🇨🇺", region: "Caribbean" },
  { city: "Montego Bay", country: "Jamaica", code: "JM", lat: 18.4762, lng: -77.8939, flag: "🇯🇲", region: "Caribbean" },
  { city: "Kingston", country: "Jamaica", code: "JM", lat: 17.9712, lng: -76.7936, flag: "🇯🇲", region: "Caribbean" },
  { city: "Punta Cana", country: "Dominican Republic", code: "DO", lat: 18.5601, lng: -68.3725, flag: "🇩🇴", region: "Caribbean" },
  { city: "Santo Domingo", country: "Dominican Republic", code: "DO", lat: 18.4861, lng: -69.9312, flag: "🇩🇴", region: "Caribbean" },
  { city: "Aruba", country: "Aruba", code: "AW", lat: 12.5211, lng: -69.9683, flag: "🇦🇼", region: "Caribbean" },
  { city: "Barbados", country: "Barbados", code: "BB", lat: 13.1939, lng: -59.5432, flag: "🇧🇧", region: "Caribbean" },
  { city: "St. Lucia", country: "St. Lucia", code: "LC", lat: 13.9094, lng: -60.9789, flag: "🇱🇨", region: "Caribbean" },
  { city: "Turks and Caicos", country: "Turks and Caicos", code: "TC", lat: 21.6940, lng: -71.7979, flag: "🇹🇨", region: "Caribbean" },
  { city: "Cayman Islands", country: "Cayman Islands", code: "KY", lat: 19.3133, lng: -81.2546, flag: "🇰🇾", region: "Caribbean" },
  { city: "St. Thomas", country: "US Virgin Islands", code: "VI", lat: 18.3381, lng: -64.8941, flag: "🇻🇮", region: "Caribbean" },
  { city: "Curacao", country: "Curacao", code: "CW", lat: 12.1696, lng: -68.9900, flag: "🇨🇼", region: "Caribbean" },

  // Oceania - Australia
  { city: "Sydney", country: "Australia", code: "AU", lat: -33.8688, lng: 151.2093, flag: "🇦🇺", region: "Oceania" },
  { city: "Melbourne", country: "Australia", code: "AU", lat: -37.8136, lng: 144.9631, flag: "🇦🇺", region: "Oceania" },
  { city: "Brisbane", country: "Australia", code: "AU", lat: -27.4698, lng: 153.0251, flag: "🇦🇺", region: "Oceania" },
  { city: "Perth", country: "Australia", code: "AU", lat: -31.9505, lng: 115.8605, flag: "🇦🇺", region: "Oceania" },
  { city: "Gold Coast", country: "Australia", code: "AU", lat: -28.0167, lng: 153.4000, flag: "🇦🇺", region: "Oceania" },
  { city: "Cairns", country: "Australia", code: "AU", lat: -16.9186, lng: 145.7781, flag: "🇦🇺", region: "Oceania" },
  { city: "Adelaide", country: "Australia", code: "AU", lat: -34.9285, lng: 138.6007, flag: "🇦🇺", region: "Oceania" },

  // Oceania - New Zealand & Pacific
  { city: "Auckland", country: "New Zealand", code: "NZ", lat: -36.8485, lng: 174.7633, flag: "🇳🇿", region: "Oceania" },
  { city: "Queenstown", country: "New Zealand", code: "NZ", lat: -45.0312, lng: 168.6626, flag: "🇳🇿", region: "Oceania" },
  { city: "Wellington", country: "New Zealand", code: "NZ", lat: -41.2865, lng: 174.7762, flag: "🇳🇿", region: "Oceania" },
  { city: "Christchurch", country: "New Zealand", code: "NZ", lat: -43.5321, lng: 172.6362, flag: "🇳🇿", region: "Oceania" },
  { city: "Fiji", country: "Fiji", code: "FJ", lat: -17.7134, lng: 178.0650, flag: "🇫🇯", region: "Oceania" },
  { city: "Bora Bora", country: "French Polynesia", code: "PF", lat: -16.5004, lng: -151.7415, flag: "🇵🇫", region: "Oceania" },
  { city: "Tahiti", country: "French Polynesia", code: "PF", lat: -17.6509, lng: -149.4260, flag: "🇵🇫", region: "Oceania" },

  // South America
  { city: "Rio de Janeiro", country: "Brazil", code: "BR", lat: -22.9068, lng: -43.1729, flag: "🇧🇷", region: "South America" },
  { city: "São Paulo", country: "Brazil", code: "BR", lat: -23.5558, lng: -46.6396, flag: "🇧🇷", region: "South America" },
  { city: "Brasília", country: "Brazil", code: "BR", lat: -15.8267, lng: -47.9218, flag: "🇧🇷", region: "South America" },
  { city: "Salvador", country: "Brazil", code: "BR", lat: -12.9714, lng: -38.5014, flag: "🇧🇷", region: "South America" },
  { city: "Buenos Aires", country: "Argentina", code: "AR", lat: -34.6037, lng: -58.3816, flag: "🇦🇷", region: "South America" },
  { city: "Patagonia", country: "Argentina", code: "AR", lat: -41.8102, lng: -68.9063, flag: "🇦🇷", region: "South America" },
  { city: "Mendoza", country: "Argentina", code: "AR", lat: -32.8895, lng: -68.8458, flag: "🇦🇷", region: "South America" },
  { city: "Lima", country: "Peru", code: "PE", lat: -12.0464, lng: -77.0428, flag: "🇵🇪", region: "South America" },
  { city: "Cusco", country: "Peru", code: "PE", lat: -13.5319, lng: -71.9675, flag: "🇵🇪", region: "South America" },
  { city: "Machu Picchu", country: "Peru", code: "PE", lat: -13.1631, lng: -72.5450, flag: "🇵🇪", region: "South America" },
  { city: "Bogotá", country: "Colombia", code: "CO", lat: 4.7110, lng: -74.0721, flag: "🇨🇴", region: "South America" },
  { city: "Cartagena", country: "Colombia", code: "CO", lat: 10.3910, lng: -75.4794, flag: "🇨🇴", region: "South America" },
  { city: "Medellín", country: "Colombia", code: "CO", lat: 6.2476, lng: -75.5658, flag: "🇨🇴", region: "South America" },
  { city: "Santiago", country: "Chile", code: "CL", lat: -33.4489, lng: -70.6693, flag: "🇨🇱", region: "South America" },
  { city: "Valparaíso", country: "Chile", code: "CL", lat: -33.0472, lng: -71.6127, flag: "🇨🇱", region: "South America" },
  { city: "Quito", country: "Ecuador", code: "EC", lat: -0.1807, lng: -78.4678, flag: "🇪🇨", region: "South America" },
  { city: "Galápagos", country: "Ecuador", code: "EC", lat: -0.9538, lng: -90.9656, flag: "🇪🇨", region: "South America" },
  { city: "La Paz", country: "Bolivia", code: "BO", lat: -16.5000, lng: -68.1500, flag: "🇧🇴", region: "South America" },
  { city: "Montevideo", country: "Uruguay", code: "UY", lat: -34.9011, lng: -56.1645, flag: "🇺🇾", region: "South America" },

  // Africa - North Africa
  { city: "Cairo", country: "Egypt", code: "EG", lat: 30.0444, lng: 31.2357, flag: "🇪🇬", region: "Africa" },
  { city: "Luxor", country: "Egypt", code: "EG", lat: 25.6872, lng: 32.6396, flag: "🇪🇬", region: "Africa" },
  { city: "Marrakech", country: "Morocco", code: "MA", lat: 31.6295, lng: -7.9811, flag: "🇲🇦", region: "Africa" },
  { city: "Casablanca", country: "Morocco", code: "MA", lat: 33.5731, lng: -7.5898, flag: "🇲🇦", region: "Africa" },
  { city: "Fez", country: "Morocco", code: "MA", lat: 34.0331, lng: -5.0003, flag: "🇲🇦", region: "Africa" },
  { city: "Tunis", country: "Tunisia", code: "TN", lat: 36.8065, lng: 10.1815, flag: "🇹🇳", region: "Africa" },

  // Africa - Sub-Saharan Africa
  { city: "Cape Town", country: "South Africa", code: "ZA", lat: -33.9249, lng: 18.4241, flag: "🇿🇦", region: "Africa" },
  { city: "Johannesburg", country: "South Africa", code: "ZA", lat: -26.2041, lng: 28.0473, flag: "🇿🇦", region: "Africa" },
  { city: "Durban", country: "South Africa", code: "ZA", lat: -29.8587, lng: 31.0218, flag: "🇿🇦", region: "Africa" },
  { city: "Nairobi", country: "Kenya", code: "KE", lat: -1.2864, lng: 36.8172, flag: "🇰🇪", region: "Africa" },
  { city: "Zanzibar", country: "Tanzania", code: "TZ", lat: -6.1659, lng: 39.2026, flag: "🇹🇿", region: "Africa" },
  { city: "Serengeti", country: "Tanzania", code: "TZ", lat: -2.3333, lng: 34.8333, flag: "🇹🇿", region: "Africa" },
  { city: "Victoria Falls", country: "Zimbabwe", code: "ZW", lat: -17.9243, lng: 25.8572, flag: "🇿🇼", region: "Africa" },
  { city: "Mauritius", country: "Mauritius", code: "MU", lat: -20.1609, lng: 57.5012, flag: "🇲🇺", region: "Africa" },
  { city: "Seychelles", country: "Seychelles", code: "SC", lat: -4.6796, lng: 55.4920, flag: "🇸🇨", region: "Africa" },
  { city: "Addis Ababa", country: "Ethiopia", code: "ET", lat: 9.0320, lng: 38.7469, flag: "🇪🇹", region: "Africa" },
  { city: "Lagos", country: "Nigeria", code: "NG", lat: 6.5244, lng: 3.3792, flag: "🇳🇬", region: "Africa" },
  { city: "Accra", country: "Ghana", code: "GH", lat: 5.6037, lng: -0.1870, flag: "🇬🇭", region: "Africa" },
  { city: "Dakar", country: "Senegal", code: "SN", lat: 14.7167, lng: -17.4677, flag: "🇸🇳", region: "Africa" },
];

export default function AddDestinationFormSmart() {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<typeof CITIES_DATABASE[0] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    city: "",
    country: "",
    countryCode: "",
    latitude: 0,
    longitude: 0,
    visitDate: "",
    isFuture: false,
    isPersonal: false,
    notes: "",
    rating: 0,
    highlights: "",
  });

  // Filter cities based on search query
  const filteredCities = searchQuery.trim()
    ? CITIES_DATABASE.filter((city) => {
        const query = searchQuery.toLowerCase();
        return (
          city.city.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query) ||
          city.region.toLowerCase().includes(query)
        );
      }).slice(0, 8) // Limit to 8 results
    : [];

  // Handle city selection from autocomplete
  const handleCitySelect = (city: typeof CITIES_DATABASE[0]) => {
    setSelectedCity(city);
    setFormData({
      ...formData,
      city: city.city,
      country: city.country,
      countryCode: city.code,
      latitude: city.lat,
      longitude: city.lng,
    });
    setSearchQuery(`${city.city}, ${city.country}`);
    setShowSuggestions(false);
  };

  // Handle manual search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    setSelectedCity(null);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that a city has been selected
    if (!selectedCity && !formData.city) {
      setError("Please select a destination from the suggestions");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          visitDate: formData.visitDate ? new Date(formData.visitDate) : null,
          highlights: formData.highlights
            ? formData.highlights.split(",").map((h) => h.trim()).filter(Boolean)
            : [],
          rating: formData.rating > 0 ? formData.rating : null,
        }),
      });

      if (response.ok) {
        router.push("/map");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add destination");
      }
    } catch (err) {
      setError("Failed to add destination. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Smart City Search */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 {t.destination}</h3>

        <div className="relative" ref={searchInputRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for a city... (e.g., Tokyo, Paris, New York)"
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-300 rounded-2xl text-lg font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            required
          />

          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
              {filteredCities.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all flex items-center gap-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-3xl">{city.flag}</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-gray-900">{city.city}</div>
                    <div className="text-sm text-gray-600">{city.country} • {city.region}</div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected City Indicator */}
          {selectedCity && (
            <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl flex items-center gap-3">
              <div className="text-3xl">{selectedCity.flag}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">✓ {selectedCity.city}, {selectedCity.country}</div>
                <div className="text-xs text-gray-600">
                  {selectedCity.lat.toFixed(4)}°N, {selectedCity.lng.toFixed(4)}°E
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity(null);
                  setSearchQuery("");
                  setFormData({
                    ...formData,
                    city: "",
                    country: "",
                    countryCode: "",
                    latitude: 0,
                    longitude: 0,
                  });
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Popular Picks */}
        {!selectedCity && !searchQuery && (
          <div className="mt-6">
            <div className="text-sm font-bold text-gray-600 mb-3">✨ Popular Destinations</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {CITIES_DATABASE.slice(0, 12).map((city) => (
                <button
                  key={`${city.code}-${city.city}`}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center"
                >
                  <div className="text-2xl mb-1">{city.flag}</div>
                  <div className="text-xs font-bold text-gray-900 text-center leading-tight">
                    {city.city}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visit Details - Only show if city selected */}
      {selectedCity && (
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-gray-900">{t.visitDetails}</h3>

          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border-2 border-orange-200">
            <input
              type="checkbox"
              id="future"
              checked={formData.isFuture}
              onChange={(e) => setFormData({ ...formData, isFuture: e.target.checked })}
              className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <label htmlFor="future" className="flex-1">
              <div className="font-bold text-sm text-gray-900">⏰ {t.futureTrip}</div>
              <div className="text-xs text-gray-600">{t.markAsFuture}</div>
            </label>
          </div>

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border-2 border-purple-200">
            <input
              type="checkbox"
              id="personal"
              checked={formData.isPersonal}
              onChange={(e) => setFormData({ ...formData, isPersonal: e.target.checked })}
              className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="personal" className="flex-1">
              <div className="font-bold text-sm text-gray-900">🔒 Personal Travel</div>
              <div className="text-xs text-gray-600">Only visible to you (unchecked = shared with household)</div>
            </label>
          </div>

          {!formData.isFuture && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📅 {t.visitDate}</label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">⭐ {t.rating}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="text-4xl transition-all hover:scale-110 active:scale-95"
                >
                  {formData.rating >= star ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              ✨ {t.highlights} <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              placeholder="Eiffel Tower, Louvre Museum, Notre Dame"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">📝 {t.notes}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
              placeholder="Add your memories and thoughts..."
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedCity}
          className="flex-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-w-[60%]"
        >
          {isSubmitting ? `💾 ${t.saving}` : `✓ ${t.addDestination}`}
        </button>
      </div>
    </form>
  );
}
