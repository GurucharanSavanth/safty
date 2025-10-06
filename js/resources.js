// ================================================
// SAFETY RESOURCES MODULE - COMPLETE & FIXED
// ================================================

const SafetyResources = {
  initiate() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
      <div class="modal-panel" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">ðŸ›¡ï¸ Safety Resources</h2>
          <button class="close-btn" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 32px;">

          <!-- Emergency Contacts -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 20px; color: #f1f5f9;">ðŸ“ž Emergency Contacts</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
              ${this.getEmergencyContacts()}
            </div>
          </div>

          <!-- First Aid -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 20px; color: #f1f5f9;">ðŸ¥ First Aid Basics</h3>
            <div style="background: var(--bg-secondary); padding: 24px; border-radius: 16px; border: 2px solid var(--bg-tertiary);">
              ${this.getFirstAidGuide()}
            </div>
          </div>

          <!-- Road Safety -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 20px; color: #f1f5f9;">ðŸš— Road Safety</h3>
            <div style="background: var(--bg-secondary); padding: 24px; border-radius: 16px; border: 2px solid var(--bg-tertiary);">
              ${this.getRoadSafetyTips()}
            </div>
          </div>

          <!-- Women Safety -->
          <div>
            <h3 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 20px; color: #f1f5f9;">ðŸ‘© Women Safety</h3>
            <div style="background: var(--bg-secondary); padding: 24px; border-radius: 16px; border: 2px solid var(--bg-tertiary);">
              ${this.getWomenSafetyInfo()}
            </div>
          </div>

        </div>
        <div class="modal-footer" style="padding: 24px; border-top: 2px solid var(--bg-tertiary); text-align: center;">
          <button onclick="this.closest('.modal-backdrop').remove()" class="submit-btn" style="padding: 14px 32px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  getEmergencyContacts() {
    const contacts = [
      { name: 'Police', number: '100', icon: 'ðŸš”', color: '#3b82f6' },
      { name: 'Ambulance', number: '108', icon: 'ðŸš‘', color: '#ef4444' },
      { name: 'Fire', number: '101', icon: 'ðŸš’', color: '#f59e0b' },
      { name: 'Women Helpline', number: '1091', icon: 'ðŸ‘©', color: '#a855f7' },
      { name: 'Child Helpline', number: '1098', icon: 'ðŸ‘¶', color: '#10b981' },
      { name: 'Disaster', number: '108', icon: 'âš ï¸', color: '#ef4444' }
    ];

    return contacts.map(c => `
      <a href="tel:${c.number}" style="display: block; padding: 20px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 12px; text-decoration: none; transition: all 0.3s; cursor: pointer;" onmouseover="this.style.borderColor='${c.color}'; this.style.transform='translateY(-4px)';" onmouseout="this.style.borderColor='var(--bg-tertiary)'; this.style.transform='translateY(0)';">
        <div style="font-size: 2.5rem; margin-bottom: 12px; text-align: center;">${c.icon}</div>
        <div style="font-weight: 700; color: #f1f5f9; margin-bottom: 8px; text-align: center;">${c.name}</div>
        <div style="color: ${c.color}; font-size: 1.5rem; font-weight: 700; text-align: center;">${c.number}</div>
      </a>
    `).join('');
  },

  getFirstAidGuide() {
    return `
      <div style="display: grid; gap: 20px;">
        <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px;">
          <strong style="color: #60a5fa; font-size: 1.1rem;">ðŸ©¹ Bleeding:</strong>
          <ul style="margin-top: 12px; padding-left: 24px; color: #cbd5e1; line-height: 1.8;">
            <li>Apply direct pressure with clean cloth</li>
            <li>Elevate injured area above heart</li>
            <li>Don't remove cloth if soaked, add more</li>
            <li>Seek help if bleeding continues</li>
          </ul>
        </div>
        <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px;">
          <strong style="color: #f87171; font-size: 1.1rem;">ðŸ”¥ Burns:</strong>
          <ul style="margin-top: 12px; padding-left: 24px; color: #cbd5e1; line-height: 1.8;">
            <li>Cool with running water 10-20 minutes</li>
            <li>Remove jewelry before swelling</li>
            <li>Cover with sterile bandage</li>
            <li>Don't apply ice or butter</li>
          </ul>
        </div>
        <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; border-radius: 8px;">
          <strong style="color: #34d399; font-size: 1.1rem;">ðŸ« CPR Basics:</strong>
          <ul style="margin-top: 12px; padding-left: 24px; color: #cbd5e1; line-height: 1.8;">
            <li>Call emergency (108) first</li>
            <li>30 chest compressions (hard & fast)</li>
            <li>2 rescue breaths</li>
            <li>Continue until help arrives</li>
          </ul>
        </div>
      </div>
    `;
  },

  getRoadSafetyTips() {
    return `
      <ul style="padding-left: 24px; color: #cbd5e1; line-height: 2;">
        <li><strong style="color: #60a5fa;">Always wear helmet/seatbelt</strong> - Reduces injury by 70%</li>
        <li><strong style="color: #60a5fa;">Follow traffic signals</strong> - Even when roads clear</li>
        <li><strong style="color: #60a5fa;">No phone while driving</strong> - It can wait</li>
        <li><strong style="color: #60a5fa;">Maintain safe distance</strong> - 2-second rule</li>
        <li><strong style="color: #60a5fa;">Check blind spots</strong> - Before lane changes</li>
        <li><strong style="color: #60a5fa;">Never drink and drive</strong> - Zero tolerance</li>
        <li><strong style="color: #60a5fa;">Regular vehicle maintenance</strong> - Check monthly</li>
        <li><strong style="color: #60a5fa;">Use indicators</strong> - Signal in advance</li>
      </ul>
    `;
  },

  getWomenSafetyInfo() {
    return `
      <div style="display: grid; gap: 20px;">
        <div>
          <strong style="color: #a855f7; font-size: 1.1rem;">Emergency Numbers:</strong>
          <ul style="margin-top: 12px; padding-left: 24px; color: #cbd5e1; line-height: 1.8;">
            <li><strong>Women Helpline:</strong> <a href="tel:1091" style="color: #a855f7; text-decoration: none; font-weight: 600;">1091</a> (24x7)</li>
            <li><strong>Police:</strong> <a href="tel:100" style="color: #a855f7; text-decoration: none; font-weight: 600;">100</a></li>
            <li><strong>Women in Distress:</strong> <a href="tel:181" style="color: #a855f7; text-decoration: none; font-weight: 600;">181</a></li>
          </ul>
        </div>
        <div>
          <strong style="color: #a855f7; font-size: 1.1rem;">Safety Tips:</strong>
          <ul style="margin-top: 12px; padding-left: 24px; color: #cbd5e1; line-height: 1.8;">
            <li>Share live location with trusted contacts</li>
            <li>Keep emergency contacts on speed dial</li>
            <li>Trust your instincts</li>
            <li>Avoid isolated areas after dark</li>
            <li>Use well-lit, populated routes</li>
            <li>Keep phone charged and accessible</li>
          </ul>
        </div>
      </div>
    `;
  }
};