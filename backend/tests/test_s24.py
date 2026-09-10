from types import SimpleNamespace

from app.services.billing import allow_billing_stub, apply_subscription_event, billing_configured, stripe_live


def test_prod_without_keys_is_not_live(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "billing_stub", False)
    monkeypatch.setattr(config.settings, "stripe_secret_key", "")
    monkeypatch.setattr(config.settings, "stripe_price_pilot_aed", "")
    assert stripe_live() is False
    assert allow_billing_stub() is False
    assert billing_configured() is False


def test_keys_and_stub_off_is_live(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "development")
    monkeypatch.setattr(config.settings, "billing_stub", False)
    monkeypatch.setattr(config.settings, "stripe_secret_key", "sk_test_x")
    monkeypatch.setattr(config.settings, "stripe_price_pilot_aed", "price_pilot")
    assert stripe_live() is True
    assert billing_configured() is True


def test_checkout_completed_activates_and_addon_bumps_quota():
    tenant = SimpleNamespace(billing_status="trialing", project_quota=3, stripe_customer_id=None, stripe_subscription_id=None)
    apply_subscription_event(tenant, "checkout.session.completed", {"object": {"payment_status": "paid", "customer": "cus_1", "metadata": {}}})
    assert tenant.billing_status == "active"
    apply_subscription_event(tenant, "checkout.session.completed", {"object": {"payment_status": "paid", "customer": "cus_1", "metadata": {"addon": "1"}}})
    assert tenant.project_quota == 6
