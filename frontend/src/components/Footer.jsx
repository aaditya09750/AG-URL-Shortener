import { Heart, Github, Linkedin, Mail } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <h3 className={styles.brandName}>URL SHORTENER</h3>
            <p className={styles.brandDesc}>
              Making the web more accessible, one link at a time.
            </p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Product</h4>
              <ul className={styles.linkList}>
                <li><a href="#features" className={styles.link}>Features</a></li>
                <li><a href="#pricing" className={styles.link}>Pricing</a></li>
                <li><a href="#api" className={styles.link}>API</a></li>
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Company</h4>
              <ul className={styles.linkList}>
                <li><a href="#about" className={styles.link}>About</a></li>
                <li><a href="#blog" className={styles.link}>Blog</a></li>
                <li><a href="#careers" className={styles.link}>Careers</a></li>
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Support</h4>
              <ul className={styles.linkList}>
                <li><a href="#help" className={styles.link}>Help Center</a></li>
                <li><a href="#privacy" className={styles.link}>Privacy Policy</a></li>
                <li><a href="#terms" className={styles.link}>Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.social}>
            <h4 className={styles.socialTitle}>Connect</h4>
            <div className={styles.socialLinks}>
            <a href="https://github.com/aaditya09750" className={styles.socialLink} aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <Github size={20} />
              </a>
              <a href="https://www.linkedin.com/in/aadityagunjal0975" className={styles.socialLink} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
              </a>
              <a href="mailto:aadigunjal0975@gmail.com" className={styles.socialLink} aria-label="Email" target="_blank" rel="noopener noreferrer">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} URL SHORTNER All rights reserved.
          </p>
          <p className={styles.love}>
            Made with <Heart size={16} className={styles.heart} /> for the web
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;