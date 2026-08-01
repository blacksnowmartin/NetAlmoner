from __future__ import annotations

from datetime import datetime

from app.models.backup import Backup
from app.models.device import Device


def test_device_crud(client):
    create_payload = {
        "hostname": "switch-01",
        "ip_address": "192.168.1.10",
        "vendor": "cisco",
        "username": "admin",
        "password": "password123",
        "port": 22,
    }

    response = client.post("/devices/", json=create_payload)
    assert response.status_code == 201
    device_data = response.json()
    assert device_data["hostname"] == create_payload["hostname"]
    assert device_data["ip_address"] == create_payload["ip_address"]
    assert device_data["vendor"] == create_payload["vendor"]
    assert "password" not in device_data

    device_id = device_data["id"]

    response = client.get(f"/devices/{device_id}")
    assert response.status_code == 200
    assert response.json()["id"] == device_id

    patch_payload = {"vendor": "arista"}
    response = client.patch(f"/devices/{device_id}", json=patch_payload)
    assert response.status_code == 200
    assert response.json()["vendor"] == patch_payload["vendor"]

    response = client.delete(f"/devices/{device_id}")
    assert response.status_code == 204

    response = client.get(f"/devices/{device_id}")
    assert response.status_code == 404


def test_metrics_dashboard_and_backup_diff(client, db_session):
    device = Device(
        hostname="router-01",
        ip_address="10.0.0.1",
        vendor="juniper",
        username="netadmin",
        password="secret",
        port=22,
    )
    db_session.add(device)
    db_session.commit()
    db_session.refresh(device)

    backup_a = Backup(
        device_id=device.id,
        config_text="interface ge-0/0/0\n description primary\n",
        success=True,
        notes="Initial backup",
        created_at=datetime.utcnow(),
    )
    backup_b = Backup(
        device_id=device.id,
        config_text="interface ge-0/0/0\n description primary\n interface ge-0/0/1\n",
        success=True,
        notes="Added extra interface",
        created_at=datetime.utcnow(),
    )

    db_session.add_all([backup_a, backup_b])
    db_session.commit()
    db_session.refresh(backup_a)
    db_session.refresh(backup_b)

    dashboard_response = client.get("/metrics/dashboard")
    assert dashboard_response.status_code == 200
    dashboard_data = dashboard_response.json()
    assert dashboard_data["total_devices"] == 1
    assert dashboard_data["backup_stats"]["total_backups"] == 2
    assert dashboard_data["backup_stats"]["successful_backups"] == 2
    assert dashboard_data["backup_stats"]["failed_backups"] == 0
    assert isinstance(dashboard_data["device_health"], list)

    diff_response = client.get(
        f"/backups/diff?base_id={backup_a.id}&compare_id={backup_b.id}"
    )
    assert diff_response.status_code == 200
    diff_data = diff_response.json()
    assert diff_data["base_backup_id"] == backup_a.id
    assert diff_data["compare_backup_id"] == backup_b.id
    assert any("+ interface ge-0/0/1" in line for line in diff_data["diff_lines"])
