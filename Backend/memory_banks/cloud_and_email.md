# Cloud and Email Services: Elearning Website Backend

## Cloudinary (Media Storage)
- **Library**: Cloudinary SDK
- **Configuration**:
  - Configured in `server.ts` using environment variables:
    - `CLOUD_NAME`
    - `CLOUD_API_KEY`
    - `CLOUD_SECRET_KEY`
  - Used for managing media uploads and storage.

### Related Files
- `server.ts`: Configures Cloudinary with environment variables.

## Email Service
- **Library**: Nodemailer
- **Templates**:
  - Located in the `mails/` directory.
  - Template files:
    - `activation-mail.ejs`
    - `order-confirmation.ejs`
    - `question-reply.ejs`

### Notes
- EJS templates are used for dynamic email content.
- Nodemailer is likely configured in `utils/sendMail.ts` (not yet analyzed).

### Related Files
- `mails/`: Contains EJS templates for email content.
- `utils/sendMail.ts`: Likely handles email sending logic.
