FEATURE:

Share Link Feature that allows users to easily share their Collection Link (unique recipe submission link) with guests through multiple platforms.

When users click the Share button, a modal opens showing four platform options:
Copy Link, Email, WhatsApp, and Facebook.

Selecting any platform automatically triggers the corresponding native share flow (e.g., opens WhatsApp with a pre-filled message containing the link).

For the first implementation, we’ll build the full flow for WhatsApp, then expand to the other options.

The behavior should closely replicate the New York Times article share experience, as shown in the example images provided (1.PNG–7.PNG).

Ideally, what´s shared is a block that has:
-Title: Share a Recipe to my Cookbook - SP&Co.
- Message: (user-name) invites you to share your favorite recipe with them! They will print it in a cookbook.
Link
See the image: example/share_feature/ideal.png

EXAMPLES:

The images in this folder (/examples/share_feature) demonstrate the complete UX reference flow from The New York Times mobile experience.
Use them as design and UX inspiration for transitions, modals, and share interactions.

share_feature/1.PNG – Share button on article

share_feature/2.PNG – Share options modal with platforms

share_feature/3.PNG – WhatsApp confirmation dialog

share_feature/4.PNG – WhatsApp chat selection view

share_feature/5.PNG – Contact selection

share_feature/6.PNG – Pre-filled message

share_feature/7.PNG – Message sent confirmation

share_feature/ideal.PNG – How the link should be

These show the exact user flow we want to replicate, adapted to Small Plates’ design and branding.

DOCUMENTATION:

Apple / Web Share API Documentation:
https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

(We can use this API for mobile browsers that support direct sharing.)

WhatsApp URL Scheme for sharing links:
https://faq.whatsapp.com/591452966008682/?cms_platform=iphone

(For our MVP, we’ll use the “https://wa.me/?text=”
 format with URL encoding to pre-fill the message.)

Example WhatsApp share link format:
https://wa.me/?text=Check%20out%20my%20recipe%20collection%20link:%20https://smallplates.co/collect/abc123

OTHER CONSIDERATIONS:

In the README, include setup instructions for environment configuration and testing the WhatsApp sharing flow.

Use the button "Copy Form Link" located in the PROFILE to trigger this.

For the MVP, implement WhatsApp sharing first (using the web intent link).
Later, expand to Email, Copy Link, and Facebook.