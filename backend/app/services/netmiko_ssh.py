from __future__ import annotations

import logging
from typing import Any

from netmiko import ConnectHandler
from netmiko.ssh_exception import NetmikoTimeoutException, NetmikoAuthenticationException

logger = logging.getLogger(__name__)


def fetch_running_config(
    hostname: str,
    ip_address: str,
    username: str,
    password: str,
    secret: str | None = None,
    port: int = 22,
    device_type: str = "cisco_ios",
) -> str:
    connection_params: dict[str, Any] = {
        "device_type": device_type,
        "host": ip_address,
        "username": username,
        "password": password,
        "port": port,
        "secret": secret,
        "banner_timeout": 60,
    }

    try:
        with ConnectHandler(**{k: v for k, v in connection_params.items() if v is not None}) as connection:
            if secret:
                connection.enable()
            running_config = connection.send_command("show running-config")
            return running_config
    except NetmikoTimeoutException as error:
        logger.exception("SSH connection timed out for device %s (%s).", hostname, ip_address)
        raise
    except NetmikoAuthenticationException as error:
        logger.exception("SSH authentication failed for device %s (%s).", hostname, ip_address)
        raise
    except Exception as error:
        logger.exception("Unexpected SSH error for device %s (%s).", hostname, ip_address)
        raise
