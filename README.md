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
