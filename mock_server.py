from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import jwt
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Secret key for JWT token
SECRET_KEY = "your-secret-key"

# Mock database
users = [
    {
        "user_id": 1,
        "first_name": "John",
        "sur_name": "Doe",
        "mid_name": "Middle",
        "phone_number": "+998901234567",
        "email": "admin@gmail.com",
        "password": "123456",  # In a real app, this would be hashed
        "role": "admin",
        "status": "active",
        "birth_place": "Tashkent",
        "birth_date": "1990-01-01",
        "ctzn": "Uzbekistan",
        "per_adr": "Some Address",
        "pport_issue_place": "Tashkent",
        "pport_issue_date": "2010-05-10",
        "pport_expr_date": "2030-05-10",
        "gd": "M",
        "certificates": [
            {
                "certificate_id": 1,
                "first_name": "John",
                "sur_name": "Doe",
                "middle_name": "Middle",
                "pin": "50801056440025",
                "given_date": "2025-03-23T13:39:41.519Z",
                "expr_date": "2027-03-23T13:39:41.519Z",
                "category": "akt",
                "status": "active",
                "reg_num": None,
                "createdAt": "2025-03-23T13:39:41.520Z",
                "updatedAt": "2025-03-23T13:39:41.520Z"
            }
        ]
    },
    {
        "user_id": 2,
        "first_name": "Jane",
        "sur_name": "Smith",
        "mid_name": "Ann",
        "phone_number": "+998907654321",
        "email": "jane.smith@example.com",
        "role": "user",
        "status": "active",
        "birth_place": "Samarkand",
        "birth_date": "1995-05-15",
        "ctzn": "Uzbekistan",
        "per_adr": "Another Address",
        "pport_issue_place": "Samarkand",
        "pport_issue_date": "2015-03-20",
        "pport_expr_date": "2025-03-20",
        "gd": "F",
        "certificates": [
            {
                "certificate_id": 2,
                "first_name": "Jane",
                "sur_name": "Smith",
                "middle_name": "Ann",
                "pin": "60123456789012",
                "given_date": "2025-02-15T10:30:00.000Z",
                "expr_date": "2027-02-15T10:30:00.000Z",
                "category": "translator",
                "status": "active",
                "reg_num": "TR-2025-0001",
                "createdAt": "2025-02-15T10:30:00.000Z",
                "updatedAt": "2025-02-15T10:30:00.000Z"
            }
        ]
    }
]

applications = [
    {
        "application_id": 1,
        "application_number": "19101",
        "first_name": "Alex",
        "sur_name": "Johnson",
        "middle_name": "James",
        "phone_number": "+998912345678",
        "tin": None,
        "gd": "M",
        "badge_img": "public/image1.png",
        "application_type": "certificate",
        "status": "new",
        "createdAt": "2025-03-20T08:15:30.000Z",
        "updatedAt": "2025-03-20T08:15:30.000Z",
        "user_id": 3,
        "region_id": None
    },
    {
        "application_id": 2,
        "application_number": "19102",
        "first_name": "Maria",
        "sur_name": "Garcia",
        "middle_name": "Elena",
        "phone_number": "+998923456789",
        "tin": None,
        "gd": "F",
        "badge_img": "public/image2.png",
        "application_type": "certificate",
        "status": "accepted",
        "createdAt": "2025-03-21T10:20:15.000Z",
        "updatedAt": "2025-03-21T12:45:30.000Z",
        "user_id": 4,
        "region_id": None
    },
    {
        "application_id": 3,
        "application_number": "19103",
        "first_name": "David",
        "sur_name": "Brown",
        "middle_name": "Michael",
        "phone_number": "+998934567890",
        "tin": None,
        "gd": "M",
        "badge_img": "public/image3.png",
        "application_type": "certificate",
        "status": "cancelled",
        "createdAt": "2025-03-22T14:30:45.000Z",
        "updatedAt": "2025-03-22T16:10:20.000Z",
        "user_id": 5,
        "region_id": None
    },
    {
        "application_id": 4,
        "application_number": "19260",
        "first_name": "Abduhamid",
        "sur_name": "Botirov",
        "middle_name": "Komiljon o'gli",
        "phone_number": "+998978917369",
        "tin": None,
        "gd": "M",
        "badge_img": "public/1742724611619_16913_photo.png",
        "application_type": "certificate",
        "status": "new",
        "createdAt": "2025-03-23T10:10:11.634Z",
        "updatedAt": "2025-03-23T10:10:11.638Z",
        "user_id": 1,
        "region_id": None
    }
]

# Routes
@app.route('/api/admin/login', methods=['POST'])
def login():
    data = request.json
    login = data.get('login')
    password = data.get('password')
    
    # Find user
    user = next((u for u in users if u['email'] == login and u['password'] == password), None)
    
    if user:
        # Create JWT token
        payload = {
            'user': user['user_id'],
            'role': user['role'],
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=10)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'error': None,
            'result': {
                'token': token
            }
        })
    
    return jsonify({
        'success': False,
        'error': 'Invalid credentials',
        'result': None
    }), 401

@app.route('/api/site/volunteers', methods=['GET'])
def get_volunteers():
    # In a real app, you would verify the token here
    # token = request.headers.get('Authorization')
    
    return jsonify({
        'success': True,
        'error': None,
        'result': users
    })

@app.route('/api/admin/applications', methods=['GET'])
def get_applications():
    # In a real app, you would verify the token here
    # token = request.args.get('token')
    
    # Count applications by status
    new_apps = sum(1 for app in applications if app['status'] == 'new')
    accepted_apps = sum(1 for app in applications if app['status'] == 'accepted')
    cancelled_apps = sum(1 for app in applications if app['status'] == 'cancelled')
    finished_apps = sum(1 for app in applications if app['status'] == 'done')
    
    return jsonify({
        'success': True,
        'error': None,
        'result': {
            'rows': applications,
            'count': len(applications),
            'totalNumberApplications': len(applications),
            'newApplications': new_apps,
            'finishedApplications': finished_apps,
            'acceptedApplications': accepted_apps,
            'cancelledApplications': cancelled_apps
        }
    })

@app.route('/api/admin/applications/<int:application_id>', methods=['PUT'])
def update_application_status(application_id):
    # In a real app, you would verify the token here
    # token = request.args.get('token')
    
    data = request.json
    new_status = data.get('status')
    
    # Find and update application
    app = next((a for a in applications if a['application_id'] == application_id), None)
    
    if app:
        app['status'] = new_status
        app['updatedAt'] = datetime.datetime.utcnow().isoformat()
        
        return jsonify({
            'success': True,
            'error': None,
            'result': app
        })
    
    return jsonify({
        'success': False,
        'error': 'Application not found',
        'result': None
    }), 404

@app.route('/api/admin/applications/certificate/<int:application_id>', methods=['PUT'])
def create_certificate(application_id):
    # In a real app, you would verify the token here
    # token = request.args.get('token')
    
    # Find application
    app = next((a for a in applications if a['application_id'] == application_id), None)
    
    if not app:
        return jsonify({
            'success': False,
            'error': 'Application not found',
            'result': None
        }), 404
    
    # Update application status
    app['status'] = 'done'
    app['updatedAt'] = datetime.datetime.utcnow().isoformat()
    
    # Create a new certificate
    now = datetime.datetime.utcnow()
    expiry = now + datetime.timedelta(days=730)  # 2 years validity
    
    certificate = {
        'certificate_id': len(users[0]['certificates']) + 1,
        'first_name': app['first_name'],
        'sur_name': app['sur_name'],
        'middle_name': app['middle_name'],
        'pin': f"{uuid.uuid4().hex[:16]}",
        'given_date': now.isoformat(),
        'expr_date': expiry.isoformat(),
        'category': 'akt',
        'status': 'active',
        'reg_num': None,
        'createdAt': now.isoformat(),
        'updatedAt': now.isoformat(),
        'user_id': app['user_id']
    }
    
    # Add certificate to user (if user exists)
    user = next((u for u in users if u['user_id'] == app['user_id']), None)
    if user:
        user['certificates'].append(certificate)
    
    return jsonify({
        'success': True,
        'error': None,
        'result': certificate
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 