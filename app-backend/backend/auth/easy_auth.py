import base64
import json
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Short names and their URI-style equivalents, in preference order.
_OID_TYPES = [
    "oid",
    "http://schemas.microsoft.com/identity/claims/objectidentifier",
]
_TID_TYPES = [
    "tid",
    "http://schemas.microsoft.com/identity/claims/tenantid",
]
_EMAIL_TYPES = [
    "preferred_username",
    "email",
    "upn",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn",
]
_NAME_TYPES = [
    "name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
]
_ROLES_TYPES = [
    "roles",
    "role",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
]
_GROUPS_TYPES = [
    "groups",
    "group",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups",
]


@dataclass
class AzureEasyAuthPrincipal:
    object_id: str = ""
    tenant_id: str = ""
    email: str = ""
    name: str = ""
    idp: str = ""
    roles: list[str] = field(default_factory=list)
    groups: list[str] = field(default_factory=list)

    @property
    def username(self) -> str:
        return self.email.lower() if self.email else f"aad_{self.object_id}"

    @property
    def is_valid(self) -> bool:
        return bool(self.object_id)


def get_claim(claims: list[dict], possible_names: list[str]) -> str:
    for name in possible_names:
        for claim in claims:
            if claim.get("typ") == name:
                val = claim.get("val", "")
                if val:
                    return val
    return ""


def _get_claims_multi(claims: list[dict], possible_names: list[str]) -> list[str]:
    results: list[str] = []
    for name in possible_names:
        for claim in claims:
            if claim.get("typ") == name:
                val = claim.get("val", "")
                if val and val not in results:
                    results.append(val)
    return results


def decode_client_principal(header_value: str) -> AzureEasyAuthPrincipal:
    try:
        padding = 4 - len(header_value) % 4
        if padding != 4:
            header_value += "=" * padding
        decoded = base64.b64decode(header_value)
        payload = json.loads(decoded)
    except Exception:
        logger.warning("Failed to decode X-MS-CLIENT-PRINCIPAL header")
        return AzureEasyAuthPrincipal()

    claims: list[dict] = payload.get("claims", [])
    idp: str = payload.get("auth_typ", "")

    return AzureEasyAuthPrincipal(
        object_id=get_claim(claims, _OID_TYPES),
        tenant_id=get_claim(claims, _TID_TYPES),
        email=get_claim(claims, _EMAIL_TYPES),
        name=get_claim(claims, _NAME_TYPES),
        idp=idp,
        roles=_get_claims_multi(claims, _ROLES_TYPES),
        groups=_get_claims_multi(claims, _GROUPS_TYPES),
    )
