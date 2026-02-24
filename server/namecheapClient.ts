const API_URL = process.env.NAMECHEAP_SANDBOX === "true"
  ? "https://api.sandbox.namecheap.com/xml.response"
  : "https://api.namecheap.com/xml.response";

const API_USER = process.env.NAMECHEAP_API_USER || "";
const API_KEY = process.env.NAMECHEAP_API_KEY || "";
const CLIENT_IP = process.env.NAMECHEAP_CLIENT_IP || "0.0.0.0";
const USERNAME = process.env.NAMECHEAP_USERNAME || API_USER;

function buildParams(command: string, extra: Record<string, string> = {}): URLSearchParams {
  const params = new URLSearchParams({
    ApiUser: API_USER,
    ApiKey: API_KEY,
    UserName: USERNAME,
    ClientIp: CLIENT_IP,
    Command: command,
    ...extra,
  });
  return params;
}

async function apiCall(command: string, extra: Record<string, string> = {}): Promise<string> {
  const params = buildParams(command, extra);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Namecheap API error: ${res.status}`);
  return res.text();
}

function parseXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseXmlAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

export function isNamecheapConfigured(): boolean {
  return !!(API_USER && API_KEY);
}

export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean;
  domain: string;
  premium: boolean;
}> {
  const xml = await apiCall("namecheap.domains.check", { DomainList: domain });
  const available = parseXmlAttr(xml, "DomainCheckResult", "Available")?.toLowerCase() === "true";
  const premium = parseXmlAttr(xml, "DomainCheckResult", "IsPremiumName")?.toLowerCase() === "true";
  return { available, domain, premium };
}

export async function getDomainPrice(domain: string): Promise<{
  registerPrice: number;
  renewPrice: number;
  currency: string;
}> {
  const tld = domain.split(".").slice(1).join(".");
  const xml = await apiCall("namecheap.users.getPricing", {
    ProductType: "DOMAIN",
    ProductCategory: "REGISTER",
    ProductName: tld,
  });
  const price = parseXmlValue(xml, "YourPrice") || parseXmlAttr(xml, "Price", "YourPrice");
  const renewXml = await apiCall("namecheap.users.getPricing", {
    ProductType: "DOMAIN",
    ProductCategory: "RENEW",
    ProductName: tld,
  });
  const renewPrice = parseXmlValue(renewXml, "YourPrice") || parseXmlAttr(renewXml, "Price", "YourPrice");

  return {
    registerPrice: price ? parseFloat(price) : 0,
    renewPrice: renewPrice ? parseFloat(renewPrice) : 0,
    currency: "USD",
  };
}

export interface DomainContact {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export async function purchaseDomain(domain: string, contact: DomainContact, years: number = 1): Promise<{
  success: boolean;
  orderId: string | null;
  transactionId: string | null;
  error: string | null;
}> {
  const sld = domain.split(".")[0];
  const tld = domain.split(".").slice(1).join(".");

  const contactParams: Record<string, string> = {};
  const prefixes = ["Registrant", "Tech", "Admin", "AuxBilling"];
  for (const prefix of prefixes) {
    contactParams[`${prefix}FirstName`] = contact.firstName;
    contactParams[`${prefix}LastName`] = contact.lastName;
    contactParams[`${prefix}Address1`] = contact.address;
    contactParams[`${prefix}City`] = contact.city;
    contactParams[`${prefix}StateProvince`] = contact.state;
    contactParams[`${prefix}PostalCode`] = contact.postalCode;
    contactParams[`${prefix}Country`] = contact.country;
    contactParams[`${prefix}Phone`] = contact.phone;
    contactParams[`${prefix}EmailAddress`] = contact.email;
  }

  try {
    const xml = await apiCall("namecheap.domains.create", {
      DomainName: domain,
      SLD: sld,
      TLD: tld,
      Years: String(years),
      ...contactParams,
    });

    const success = parseXmlAttr(xml, "DomainCreateResult", "Registered")?.toLowerCase() === "true";
    const orderId = parseXmlAttr(xml, "DomainCreateResult", "OrderID") || parseXmlValue(xml, "OrderID");
    const transactionId = parseXmlAttr(xml, "DomainCreateResult", "TransactionID") || parseXmlValue(xml, "TransactionID");

    if (!success) {
      const errorMsg = parseXmlValue(xml, "Message") || parseXmlValue(xml, "Error") || "Registration failed";
      return { success: false, orderId: null, transactionId: null, error: errorMsg };
    }

    return { success: true, orderId, transactionId, error: null };
  } catch (err: any) {
    return { success: false, orderId: null, transactionId: null, error: err.message };
  }
}

export async function setDomainDns(domain: string, targetHost: string): Promise<boolean> {
  const sld = domain.split(".")[0];
  const tld = domain.split(".").slice(1).join(".");

  await apiCall("namecheap.domains.dns.setCustom", {
    SLD: sld,
    TLD: tld,
    Nameservers: "dns1.registrar-servers.com,dns2.registrar-servers.com",
  });

  await apiCall("namecheap.domains.dns.setHosts", {
    SLD: sld,
    TLD: tld,
    HostName1: "@",
    RecordType1: "CNAME",
    Address1: targetHost,
    TTL1: "1800",
    HostName2: "www",
    RecordType2: "CNAME",
    Address2: targetHost,
    TTL2: "1800",
  });

  return true;
}

export async function getDomainInfo(domain: string): Promise<{
  status: string;
  createdDate: string | null;
  expireDate: string | null;
  autoRenew: boolean;
}> {
  const xml = await apiCall("namecheap.domains.getInfo", { DomainName: domain });
  const status = parseXmlAttr(xml, "DomainGetInfoResult", "Status") || "unknown";
  const createdDate = parseXmlValue(xml, "CreatedDate");
  const expireDate = parseXmlValue(xml, "ExpiredDate");
  const autoRenew = parseXmlAttr(xml, "DomainGetInfoResult", "IsAutoRenew")?.toLowerCase() === "true";

  return { status, createdDate, expireDate, autoRenew };
}
