import os
from dotenv import load_dotenv
import requests
from time import time
from airlines import AIRLINE_NAMES

load_dotenv()
_amadeus_token = {"token": None, "expires_at": 0}

def get_airline_full_name(iata):
    return AIRLINE_NAMES.get(iata, iata)

def get_amadeus_token():
    global _amadeus_token
    AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
    AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")
    if _amadeus_token["token"] and _amadeus_token["expires_at"] > time() + 10:
        return _amadeus_token["token"]
    token_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    try:
        res = requests.post(token_url, data={
            "grant_type": "client_credentials",
            "client_id": AMADEUS_API_KEY,
            "client_secret": AMADEUS_API_SECRET
        }, timeout=10)
        res.raise_for_status()
        data = res.json()
        token = data.get("access_token")
        expires_in = int(data.get("expires_in", 0))
        _amadeus_token["token"] = token
        _amadeus_token["expires_at"] = time() + expires_in
        return token
    except Exception as e:
        print("Amadeus token error:", e)
        return None

def airline_logo_url(iata):
    if not iata:
        return ""
    return f"https://content.r9cdn.net/rimg/provider-logos/airlines/v/{iata}.png?width=200&height=200"

def airline_logo_fallback(iata):
    if not iata:
        return ""
    return f"https://pics.avs.io/200/200/{iata}.png"

def convert_price(amount, from_cur, to_cur):
    if from_cur == to_cur or not amount:
        return float(amount)
    try:
        url = f"https://api.exchangerate.host/convert?from={from_cur}&to={to_cur}&amount={amount}"
        resp = requests.get(url, timeout=3)
        if resp.ok:
            data = resp.json()
            return round(data.get("result", float(amount)), 2)
    except Exception as e:
        print("Currency conversion error:", e)
    return float(amount)

def fetch_amadeus(origin, destination, date, return_date, adults, travel_class, currency):
    results = []
    access_token = get_amadeus_token()
    if access_token:
        try:
            url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
            headers = {"Authorization": f"Bearer {access_token}"}
            params = {
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDate": date,
                "adults": adults,
                "travelClass": travel_class.upper(),
                "currencyCode": currency,
                "max": 10
            }
            if return_date:
                params["returnDate"] = return_date
            resp = requests.get(url, headers=headers, params=params, timeout=4)
            resp.raise_for_status()
            response = resp.json()
            offers = response.get("data", [])
            for offer in offers:
                try:
                    price = offer.get("price", {}).get("total")
                    offer_currency = offer.get("price", {}).get("currency", currency)
                    price_converted = convert_price(price, offer_currency, currency)
                    validating_airline = None
                    if offer.get("validatingAirlineCodes"):
                        validating_airline = offer["validatingAirlineCodes"][0]
                    airline_full_name = get_airline_full_name(validating_airline)
                    itineraries = offer.get("itineraries", [])
                    segments = []
                    outbound = []
                    inbound = []
                    if itineraries:
                        for idx, it in enumerate(itineraries):
                            segs = []
                            for seg in it.get("segments", []):
                                segs.append({
                                    "departure": seg.get("departure", {}),
                                    "arrival": seg.get("arrival", {}),
                                    "carrierCode": seg.get("carrierCode"),
                                    "number": seg.get("number"),
                                    "duration": seg.get("duration"),
                                    "aircraft": seg.get("aircraft", {}).get("code")
                                })
                            if idx == 0:
                                outbound = segs
                            elif idx == 1:
                                inbound = segs
                            segments.extend(segs)
                    res_obj = {
                        "source": "Amadeus",
                        "airline": validating_airline or offer.get("validatingAirlineCodes") or None,
                        "airline_full_name": airline_full_name,
                        "logo": airline_logo_url(validating_airline),
                        "logo_fallback": airline_logo_fallback(validating_airline),
                        "price": price_converted,
                        "currency": currency,
                        "depart_time": outbound[0]["departure"].get("at") if outbound else (segments[0]["departure"].get("at") if segments else None),
                        "arrive_time": outbound[-1]["arrival"].get("at") if outbound else (segments[-1]["arrival"].get("at") if segments else None),
                        "return_depart_time": inbound[0]["departure"].get("at") if inbound else None,
                        "return_arrive_time": inbound[-1]["arrival"].get("at") if inbound else None,
                        "stops": max(0, len(segments) - 1),
                        "duration": itineraries[0].get("duration") if itineraries else None,
                        "return_duration": itineraries[1].get("duration") if len(itineraries) > 1 else None,
                        "segments": segments,
                        "outbound_segments": outbound,
                        "inbound_segments": inbound,
                        "cabin": travel_class.upper(),
                        "passenger_info": {
                            "adults": int(adults),
                            "children": 0,
                            "infant": 0,
                        },
                        "link": "#book_online"
                    }
                    results.append(res_obj)
                except Exception as inner_e:
                    print("Amadeus offer parse error:", inner_e)
        except Exception as e:
            print("Amadeus search error:", e)
    else:
        print("No Amadeus access token available")
    return results

def get_flight_results(origin, destination, date, return_date=None, adults=1, travel_class="ECONOMY", currency="USD"):
    return fetch_amadeus(origin, destination, date, return_date, adults, travel_class, currency)

# ... (existing imports and code)

def fetch_locations(keyword, sub_types='AIRPORT,CITY', limit=20):
    """
    Fetch airports and cities matching a keyword.
    Endpoint: /v1/reference-data/locations
    """
    access_token = get_amadeus_token()
    if not access_token:
        return []
    url = "https://test.api.amadeus.com/v1/reference-data/locations"
    params = {
        "keyword": keyword,
        "subType": sub_types,
        "page[limit]": limit
    }
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"}, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get('data', [])
    except Exception as e:
        print("Locations search error:", e)
        return []

def fetch_flight_status(carrier_code, flight_number, departure_date):
    """
    Fetch real-time or scheduled flight status/data.
    Endpoint: /v1/operations/flight-statuses
    departure_date format: YYYY-MM-DD
    """
    access_token = get_amadeus_token()
    if not access_token:
        return None
    url = "https://test.api.amadeus.com/v1/operations/flight-statuses"
    params = {
        "carrierCode": carrier_code.upper(),
        "flightNumber": flight_number,
        "scheduledDepartureDate": departure_date
    }
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"}, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get('data', [None])[0]  # Return first match or None
    except Exception as e:
        print("Flight status error:", e)
        return None

def fetch_safety_ratings(latitude, longitude, radius_km=10):
    """
    Fetch safety ratings for a location (e.g., crime, health risks).
    Endpoint: /v1/safety/safety-rated-locations
    """
    access_token = get_amadeus_token()
    if not access_token:
        return []
    url = "https://test.api.amadeus.com/v1/safety/safety-rated-locations"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "radius": radius_km
    }
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"}, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get('data', [])
    except Exception as e:
        print("Safety ratings error:", e)
        return []

def fetch_travel_restrictions(country_code):
    """
    Fetch travel restrictions (e.g., visa, COVID rules). Note: May require Duty of Care access.
    Endpoint: /v1/duty-of-care/diseases/covid19-area-report (or similar; check your access)
    """
    access_token = get_amadeus_token()
    if not access_token:
        return None
    url = "https://test.api.amadeus.com/v1/duty-of-care/diseases/covid19-area-report"
    params = {"countryCode": country_code.upper()}
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"}, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get('data', None)
    except Exception as e:
        print("Travel restrictions error:", e)
        return None

# ... (existing get_flight_results function)