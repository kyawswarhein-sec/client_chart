# 📊 Client Chart Dashboard

A comprehensive web-based admin dashboard for client management with real-time data visualization, built with PHP, MySQL, HTML5, CSS3, and JavaScript.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![PHP](https://img.shields.io/badge/PHP-8.0+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.0+-purple)

## 🌟 Features

### 🔐 Authentication System
- **Secure Login/Logout** with session management
- **SHA256 Password Hashing** for security
- **Admin Panel Access Control**

### 📊 Data Visualization
- **Interactive Charts** (Age Distribution, Gender Distribution, Visa Type Distribution)
- **Real-time Statistics** with client count cards
- **Chart.js Integration** for beautiful data visualization

### 👥 Client Management
- **Complete CRUD Operations** (Create, Read, Update, Delete)
- **Advanced Search & Filtering** by name, location, gender, visa type
- **Pagination Support** (10, 30, 50, 100, All clients per page)
- **Sorting Capabilities** for multiple columns
- **Batch Operations** (Select All, Delete Selected)

### 🎨 Modern UI/UX
- **Responsive Design** with Bootstrap 5
- **Beautiful Modals** for client details, confirmations, and forms
- **Smooth Animations** and transitions
- **Custom Scrollbars** and hover effects
- **Loading States** and progress indicators

### 🏗️ Architecture
- **Frontend/Backend Separation** for clean code organization
- **RESTful API Design** for data operations
- **Modular File Structure** for maintainability

## 🚀 Quick Start

### Prerequisites
- **XAMPP** (Apache, MySQL, PHP)
- **Web Browser** (Chrome, Firefox, Safari)
- **Git** (for version control)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kyawswarhein-sec/client_chart.git
   cd client_chart
   ```

2. **Start XAMPP Services**
   - Start Apache Server
   - Start MySQL Database

3. **Create Database**
   - Open phpMyAdmin (`http://localhost/phpmyadmin`)
   - Create database named `client_data`
   - Import `assets/backup/200_clients_data.sql`

4. **Configure Database Connection**
   ```php
   // backend/db.php
   $host = "localhost";
   $user = "root";
   $pass = "";
   $db = "client_data";
   ```

5. **Access Application**
   ```
   http://localhost/client_chart
   ```

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

## 📁 Project Structure

client_chart/
├── backend/              # PHP backend API endpoints
│   ├── login.php         # Handles user authentication
│   ├── logout.php        # Manages user logout and session termination
│   ├── dashboard.php     # Provides dashboard data
│   ├── check_session.php # Validates user session status
│   ├── add_client.php    # API to add a new client
│   ├── delete_clients.php# API to delete client records
│   ├── get_login_error.php # Returns login error details
│   └── db.php            # Database connection and configuration
├── frontend/             # Frontend user interface files
│   ├── dashboard.html    # Main dashboard layout
│   ├── dashboard.css     # Dashboard page styling
│   ├── dashboard.js      # Dashboard page interactivity
│   ├── login.html        # Login form layout
│   ├── login.css         # Login page styling
│   └── login.js          # Login page interactivity
├── assets/               # Static assets
│   ├── backup/           # Database backup files
│   │   └── 200_clients_data.sql
│   └── pics/             # Images and icons
├── index.php             # Application entry point
└── README.md             # Project documentation


## 🗄️ Database Schema

### `admin` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT(11) | Primary key |
| username | VARCHAR(50) | Admin username |
| password | VARCHAR(255) | SHA256 hashed password |
| created_at | TIMESTAMP | Account creation time |

### `clients` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT(11) | Primary key |
| name | VARCHAR(100) | Client full name |
| type | VARCHAR(50) | Visa type (H1B, F1, L1, O1, J1) |
| age | INT(11) | Client age |
| dob | DATE | Date of birth |
| location | VARCHAR(255) | Client location |
| gender | ENUM | Male, Female, Other |
| arrival_date | DATE | Arrival date |
| visa_expiry_date | DATE | Visa expiration |
| us_arrival_date | DATE | US arrival date |
| phone | VARCHAR(20) | Contact phone |
| note | TEXT | Additional notes |

## 🔧 API Endpoints

### Authentication
- `POST /backend/login.php` - User login
- `GET /backend/logout.php` - User logout
- `GET /backend/check_session.php` - Session validation

### Client Management
- `GET /backend/dashboard.php` - Dashboard data
- `POST /backend/add_client.php` - Add new client
- `POST /backend/delete_clients.php` - Delete clients

### Error Handling
- `GET /backend/get_login_error.php` - Get login errors

## 🎯 Key Features in Detail

### 📊 Charts & Analytics
- **Age Distribution:** Doughnut chart with 5 age groups
- **Gender Distribution:** Visual breakdown by gender
- **Visa Type Distribution:** Distribution of visa categories
- **Client Statistics:** Total count with real-time updates

### 🔍 Search & Filter
- **Text Search:** Search by name, location, phone
- **Gender Filter:** Filter by Male, Female, Other
- **Location Filter:** Dynamic location-based filtering
- **Visa Type Filter:** Filter by visa categories

### 📋 Client Management
- **View Details:** Beautiful modal with complete client info
- **Add Client:** Form validation with required fields
- **Batch Delete:** Select multiple clients for deletion
- **ID Reordering:** Automatic ID cleanup for small deletions

### 🎨 UI Components
- **Responsive Tables:** Mobile-friendly data display
- **Custom Modals:** Success, error, confirmation dialogs
- **Loading States:** Visual feedback during operations
- **Smooth Animations:** CSS keyframes and transitions

## 🛠️ Technologies Used

### Backend
- **PHP 8.0+** - Server-side logic
- **MySQL 8.0+** - Database management
- **MySQLi** - Database connectivity

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Styling and animations
- **JavaScript ES6+** - Interactive functionality
- **Bootstrap 5** - Responsive framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### Development Tools
- **XAMPP** - Local development environment
- **Git** - Version control
- **VS Code** - Code editor

## 🔒 Security Features

- **Session Management** - Secure user sessions
- **Password Hashing** - SHA256 encryption
- **SQL Injection Prevention** - Prepared statements
- **XSS Protection** - Input sanitization
- **CSRF Protection** - Form validation

## 🚀 Performance Optimizations

- **Database Transactions** - Data integrity
- **Efficient Queries** - Optimized SQL operations
- **Smart ID Reordering** - Conditional cleanup
- **Pagination** - Large dataset handling
- **Memory Management** - PHP resource limits

## 🎨 Customization

### Modify Chart Colors
```javascript
// dashboard.js - Chart color schemes
const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
```

### Update Pagination Options
```javascript
// dashboard.js - Clients per page options
const paginationOptions = [10, 30, 50, 100];
```

### Change Theme Colors
```css
/* dashboard.css - Color variables */
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --danger-color: #dc3545;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check XAMPP MySQL service
   - Verify database credentials in `backend/db.php`

2. **Login Not Working**
   - Ensure admin account exists in database
   - Check password hash in database

3. **Charts Not Loading**
   - Verify Chart.js CDN connection
   - Check browser console for JavaScript errors

4. **Session Issues**
   - Clear browser cache and cookies
   - Restart Apache server

## 📈 Future Enhancements

- [ ] **User Roles & Permissions**
- [ ] **Client Photo Upload**
- [ ] **Export Data (PDF, Excel)**
- [ ] **Email Notifications**
- [ ] **Advanced Analytics**
- [ ] **Mobile App**
- [ ] **API Documentation**
- [ ] **Unit Testing**

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **GitHub Issues:** [Create an issue](https://github.com/kyawswarhein-sec/client_chart/issues)
- **Email:** your-email@example.com

## 🙏 Acknowledgments

- **Bootstrap Team** for the responsive framework
- **Chart.js Team** for beautiful charts
- **Font Awesome** for amazing icons
- **XAMPP Team** for the development environment

---

⭐ **Star this repo if you find it helpful!** ⭐

Built with ❤️ by [Your Name](https://github.com/kyawswarhein-sec)
