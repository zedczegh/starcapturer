
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.11'
import * as React from 'npm:react@18.3.1'

interface VerificationEmailProps {
  email: string;
  verification_url: string;
}

export const VerificationEmail = ({
  email,
  verification_url,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to complete signup</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={h1}>Welcome to AstroSIQS! 🌟</Heading>
            <Text style={text}>
              Thanks for signing up! We're excited to help you discover amazing stargazing locations.
            </Text>
            <Text style={text}>
              Please verify your email address ({email}) by clicking the button below:
            </Text>
            <Button style={button} href={verification_url}>
              Verify Email
            </Button>
            <Text style={text}>
              If you didn't create an account, you can safely ignore this email.
            </Text>
            <Text style={footer}>
              <Link href="https://astrosiqs.com" style={link}>
                AstroSIQS
              </Link>
              {' - Your Gateway to the Stars 🌠'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: '#0f172a',
  color: '#fff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#8b5cf6',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 20px',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0',
  color: '#e2e8f0',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  fontSize: '16px',
};

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  marginTop: '32px',
};
