# ZirabAfrica

A web application for managing flight bookings, airtime purchases, and payments.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ZirabAfrica
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .\.venv\Scripts\Activate.ps1
   # On Unix or MacOS:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your actual configuration values in `.env`
   - Obtain Firebase credentials and save them as a JSON file
   - Update FIREBASE_CREDENTIALS_PATH in `.env` to point to your credentials file

5. Firebase Setup:
   - Create a Firebase project at https://console.firebase.google.com
   - Generate a new private key for service account
   - Save the JSON file in your project directory (do not commit this file)
   - Update the Firebase configuration in `.env`

## Development

To run the development server:
```bash
flask run
```

## Production Deployment

For production deployment:
1. Ensure all environment variables are properly set
2. Set FLASK_DEBUG=0 in your production environment
3. Use waitress-serve for production server:
```bash
waitress-serve --host=0.0.0.0 --port=8000 app:app
```

## Features

- User Authentication
- Flight Booking
- Airtime Purchase
- Payment Integration
- Email Notifications

## Security Notes

- Never commit sensitive credentials to the repository
- Keep your `.env` file secure and never share it
- Regularly rotate API keys and secrets
- Use environment variables for all sensitive configuration