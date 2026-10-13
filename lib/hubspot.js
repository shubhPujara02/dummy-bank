// Minimal HubSpot CRM v3 client (contacts only), using Node's built-in fetch.
// Auth: a Private App access token in HUBSPOT_ACCESS_TOKEN.

const { HUBSPOT_PROPERTY_GROUP, HUBSPOT_PROPERTIES } = require('./catalog');

const BASE = 'https://api.hubapi.com';

function token() {
  return process.env.HUBSPOT_ACCESS_TOKEN || '';
}

function isConfigured() {
  return Boolean(token());
}

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(`HubSpot ${method} ${path} → ${res.status}: ${data.message || text}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Creates the "Dummy Bank" property group and db_* properties if missing.
async function ensureProperties() {
  try {
    await request('POST', '/crm/v3/properties/contacts/groups', {
      name: HUBSPOT_PROPERTY_GROUP.name,
      label: HUBSPOT_PROPERTY_GROUP.label,
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }

  const created = [];
  for (const prop of HUBSPOT_PROPERTIES) {
    const def = prop.options
      ? {
          type: 'enumeration',
          fieldType: 'select',
          options: prop.options.map((o, i) => ({ ...o, displayOrder: i })),
        }
      : { type: 'string', fieldType: 'text' };
    try {
      await request('POST', '/crm/v3/properties/contacts', {
        name: prop.name,
        label: prop.label,
        groupName: HUBSPOT_PROPERTY_GROUP.name,
        ...def,
      });
      created.push(prop.name);
    } catch (err) {
      if (err.status !== 409) throw err;
    }
  }
  return created;
}

// Create-or-update contacts keyed by email, up to 100 per call.
async function upsertContacts(contacts) {
  const results = [];
  for (let i = 0; i < contacts.length; i += 100) {
    const inputs = contacts.slice(i, i + 100).map((properties) => ({
      idProperty: 'email',
      id: properties.email,
      properties,
    }));
    const data = await request('POST', '/crm/v3/objects/contacts/batch/upsert', { inputs });
    results.push(...(data.results || []));
  }
  return results;
}

async function upsertContact(properties) {
  const [result] = await upsertContacts([properties]);
  return result;
}

module.exports = { isConfigured, request, ensureProperties, upsertContacts, upsertContact };
