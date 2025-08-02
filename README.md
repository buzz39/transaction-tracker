# Transaction Tracker

A simple, self-hosted transaction logging application that uses Google Sheets as a database via [SheetDB](https://sheetdb.io/).

## Features

- **No Database Needed**: Leverages Google Sheets for data storage, making it easy to set up and manage.
- **User Roles**: Basic authentication system with two roles: `investor` and `other`.
- **Transaction Logging**: Users can log transactions with an amount, date, and optional note.
- **Transaction Confirmation**: A confirmation workflow allows for a secondary approval of transactions.
- **Multiple Sheet Support**: Easily switch between different Google Sheets for different projects.
- **Configurable**: All major settings, including API endpoints and user credentials, can be configured in a single file.
- **Responsive Design**: A clean, mobile-friendly interface built with Tailwind CSS.

## How It Works

The application is a single-page web app that authenticates users and allows them to log transactions. These transactions are sent to a [SheetDB](https://sheetdb.io/) API, which in turn writes the data to a Google Sheet. The dashboard displays recent transactions and provides a full history view.

## Setup

1.  **Google Sheet Setup**:
    *   Create a new Google Sheet.
    *   Set up the following headers in the first row: `ID`, `Date`, `Timestamp`, `Type`, `Amount`, `Return Amount`, `Status`, `Notes`.
    *   The `ID` column can be populated with a formula like `=ROW()-1` to auto-increment.

2.  **SheetDB Setup**:
    *   Go to [sheetdb.io](https://sheetdb.io/) and create an account.
    *   Create a new API and paste in your Google Sheet's URL.
    *   Copy the API endpoint URL.

3.  **Configuration**:
    *   Open `dashboard/config.js`.
    *   In the `AppConfig.sheets` object, replace the placeholder API URL with your SheetDB API endpoint. You can add multiple sheets for different projects.
    *   It is **strongly recommended** to change the default `AppConfig.users` credentials for security.

4.  **Running the Application**:
    *   Open `dashboard/index.html` in your web browser. No web server is required.

## Configuration

All configuration is done in the `dashboard/config.js` file.

*   `AppConfig.sheets`: An object containing the different sheets you want to connect to. The key is used for the tab name in the UI, and the `api` value is the SheetDB endpoint.
*   `AppConfig.users`: An array of user objects with `username`, `password`, and `role`.
*   `AppConfig.defaultSheet`: The sheet that is loaded by default when the application starts.

## Bot (Optional)

The `bot` directory contains a Node.js script that is not integrated with the main application. It appears to be for a separate purpose and is not required for the transaction tracker to function.

## Contributing

Feel free to fork this repository and make your own modifications. Pull requests are welcome.
