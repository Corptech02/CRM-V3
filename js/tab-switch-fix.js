// ============================================================
// DEFINITIVE TAB SWITCH FIX - loaded last, overrides everything
// v3: head-injected style survives re-renders and beats JS overrides
// ============================================================
(function () {
    'use strict';

    // Inject (or replace) a persistent <style> in <head>.
    // A head stylesheet !important beats any non-!important inline style
    // that other scripts might write via element.style.display = 'x'.
    // It also survives loadLeadsView() completely re-rendering dashboard-content.
    function injectHeadStyle(tabName) {
        var existing = document.getElementById('_tab_switch_style');
        if (existing) existing.remove();
        var s = document.createElement('style');
        s.id = '_tab_switch_style';
        if (tabName === 'archived') {
            s.textContent =
                '#active-leads-tab   { display: none  !important; overflow: hidden !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }' +
                '#archived-leads-tab { display: block !important; }';
        } else {
            s.textContent =
                '#archived-leads-tab { display: none  !important; overflow: hidden !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }' +
                '#active-leads-tab   { display: block !important; }';
        }
        document.head.appendChild(s);
    }

    function scrollToTop() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        // Cover any inner scroll containers too
        ['#active-leads-tab', '#archived-leads-tab', '.leads-view',
         '.content-area', '.dashboard-content', '.main-content'].forEach(function (sel) {
            var el = document.querySelector(sel);
            if (el) el.scrollTop = 0;
        });
    }

    function applyTabState(tabName) {
        // 1. Head stylesheet (survives re-renders, beats non-important inline styles)
        injectHeadStyle(tabName);

        // 2. Also set inline styles for immediate same-frame effect
        var activeTab   = document.getElementById('active-leads-tab');
        var archivedTab = document.getElementById('archived-leads-tab');

        if (!activeTab || !archivedTab) return false;

        if (tabName === 'archived') {
            activeTab.style.setProperty('display',   'none',   'important');
            activeTab.style.setProperty('height',    '0',      'important');
            activeTab.style.setProperty('overflow',  'hidden', 'important');
            activeTab.style.setProperty('padding',   '0',      'important');
            activeTab.style.setProperty('margin',    '0',      'important');
            archivedTab.style.removeProperty('display');
            archivedTab.style.removeProperty('height');
            archivedTab.style.setProperty('display', 'block',  'important');
        } else {
            archivedTab.style.setProperty('display',  'none',   'important');
            archivedTab.style.setProperty('height',   '0',      'important');
            archivedTab.style.setProperty('overflow', 'hidden', 'important');
            archivedTab.style.setProperty('padding',  '0',      'important');
            archivedTab.style.setProperty('margin',   '0',      'important');
            activeTab.style.removeProperty('display');
            activeTab.style.removeProperty('height');
            activeTab.style.setProperty('display', 'block', 'important');
        }

        // 3. Update tab button colours
        document.querySelectorAll('.lead-tab').forEach(function (btn) {
            var text = btn.textContent || '';
            var isSelected = (tabName === 'archived' && text.includes('Archived')) ||
                             (tabName === 'active'   && text.includes('Active'));
            btn.style.background = isSelected ? '#3b82f6' : '#f3f4f6';
            btn.style.color      = isSelected ? 'white'   : '#6b7280';
        });

        return true;
    }

    // ---- public switchLeadTab ----
    window.switchLeadTab = function (tabName) {
        window._currentLeadTab = tabName;

        var applied = applyTabState(tabName);

        // Scroll immediately, then again after async content loads
        scrollToTop();
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 200);
        setTimeout(scrollToTop, 600);
        setTimeout(scrollToTop, 1200);

        // Load archived data (async — do AFTER styles are set)
        if (tabName === 'archived' && typeof window.loadArchivedLeads === 'function') {
            window.loadArchivedLeads();
        }

        console.log('[tab-switch-fix v3] switched to', tabName, '| applied:', applied);
    };

    // Re-apply whenever the leads view is re-rendered into the DOM
    var observer = new MutationObserver(function (mutations) {
        if (!window._currentLeadTab) return;
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var node = added[j];
                if (node.nodeType !== 1) continue;
                var hasLeadTabs = node.id === 'active-leads-tab'   ||
                                  node.id === 'archived-leads-tab' ||
                                  (node.querySelector && node.querySelector('#active-leads-tab'));
                if (hasLeadTabs) {
                    (function (tab) {
                        setTimeout(function () { applyTabState(tab); scrollToTop(); }, 30);
                        setTimeout(function () { applyTabState(tab); scrollToTop(); }, 200);
                        setTimeout(function () { applyTabState(tab); scrollToTop(); }, 600);
                    })(window._currentLeadTab);
                    return;
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log('[tab-switch-fix v3] loaded and ready');
})();
