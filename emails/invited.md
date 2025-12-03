<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited - Small Plates & Co.</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-family: 'Georgia', serif;
      font-size: 32px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 15px 0;
    }
    .header p {
      font-size: 18px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }
    .content {
      margin-bottom: 40px;
      text-align: center;
    }
    .content p {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .invite-button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    .invite-button:hover {
      background-color: #333333;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e5e5;
      margin-top: 40px;
    }
    .footer p {
      font-size: 14px;
      color: #999;
      margin: 5px 0;
    }
    .link-text {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Logo -->
    <div class="logo">
      <h2 style="font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a; margin: 0; font-weight: 400;">
        Small Plates & Co.
      </h2>
    </div>

    <!-- Header -->
    <div class="header">
      <h1>You're Invited!</h1>
      <p>Join Small Plates & Co. and start creating your cookbook</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Great news! You've been invited to join Small Plates & Co.</p>
      <p>We're excited to have you on board. Click the button below to set up your account and start creating your personalized cookbook:</p>
    </div>

    <!-- Button -->
    <div class="button-container">
      <a href="{{ .ConfirmationURL }}" class="invite-button">
        Accept Invitation
      </a>
    </div>

    <!-- Alternative link -->
    <div class="content">
      <p style="font-size: 14px; color: #999;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <div class="link-text">
        {{ .ConfirmationURL }}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This invitation was sent by Small Plates & Co.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p style="margin-top: 15px; font-size: 12px;">This link expires in 24 hours.</p>
    </div>
  </div>
</body>
</html>