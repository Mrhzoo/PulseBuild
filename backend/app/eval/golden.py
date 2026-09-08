GOLDEN_CASES = [
    {
        "name": "schedule_delay_letter",
        "snapshot": {
            "project_id": "p1",
            "project_name": "Marina Fitout",
            "tenant_role": "sub",
            "currency": "AED",
            "events": [],
            "document_excerpts": [
                {"pointer": "doc-sched-1#page=1", "text": "The programme is delayed by two weeks due to late access."}
            ],
        },
    },
    {
        "name": "ipc_payment",
        "snapshot": {
            "project_id": "p2",
            "project_name": "Warehouse MEP",
            "tenant_role": "sub",
            "currency": "AED",
            "events": [],
            "document_excerpts": [
                {"pointer": "doc-ipc-2#page=1", "text": "Interim payment certificate IPC-04. Retention held at 10 percent."}
            ],
        },
    },
    {
        "name": "change_order_email",
        "snapshot": {
            "project_id": "p3",
            "project_name": "Facade Package",
            "tenant_role": "supplier",
            "currency": "AED",
            "events": [],
            "document_excerpts": [
                {"pointer": "msg-2026-09-01", "text": "Please proceed with a variation: revised qty for aluminium panels."}
            ],
        },
    },
    {
        "name": "arabic_delay_letter",
        "snapshot": {
            "project_id": "p5",
            "project_name": "Al Furjan Villa",
            "tenant_role": "sub",
            "currency": "AED",
            "events": [],
            "document_excerpts": [
                {"pointer": "doc-ar-1#p1", "text": "يوجد تأخير أسبوعين في البرنامج بسبب تأخر التسليم."}
            ],
        },
    },
    {
        "name": "thin_empty",
        "snapshot": {
            "project_id": "p4",
            "project_name": "New Project",
            "tenant_role": "sub",
            "currency": "AED",
            "events": [],
            "document_excerpts": [],
        },
    },
]
